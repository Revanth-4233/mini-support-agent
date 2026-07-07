"""
app.py — Main entry point: CLI + FastAPI web server.

Usage:
    CLI mode:   python app.py "What is the return policy for electronics?"
    Web mode:   python app.py              (opens http://localhost:8000)
"""

import sys
import json
import time
import uvicorn
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse

import rag
import tools
from router import classify_query, generate_answer

# ─────────────────────────────────────────────────────────────────────────
# Agent Orchestrator
# ─────────────────────────────────────────────────────────────────────────

def process_query(query: str) -> Dict:
    """
    Main orchestration function.

    1. Classify the query (router)
    2. Fetch relevant context (RAG and/or CSV lookup)
    3. Generate a final answer via LLM

    Returns a dict with: answer, route, reasoning_steps, sources
    """
    steps: List[Dict] = []
    sources: List[Dict] = []
    start = time.time()

    # ── Step 1: Route ────────────────────────────────────────────────
    steps.append({"step": "Classifying query intent...", "status": "running"})
    classification = classify_query(query)
    intent = classification["intent"]
    order_id = classification.get("order_id")
    steps[-1]["status"] = "done"
    steps[-1]["result"] = f"Intent: {intent}" + (f"  |  Order: {order_id}" if order_id else "")
    steps.append({"step": f"Route → {intent}", "status": "done", "result": classification.get("reasoning", "")})

    context_parts: list[str] = []

    # ── Step 2a: Order data lookup ───────────────────────────────────
    if intent in ("ORDER_DATA", "HYBRID"):
        steps.append({"step": f"Looking up order {order_id}...", "status": "running"})

        if not order_id:
            steps[-1]["status"] = "error"
            steps[-1]["result"] = "No order ID found in query"
            return _build_response(
                "I'd be happy to look up your order, but I couldn't find an order ID in your question. "
                "Could you please provide your order ID? It looks like ORD followed by four digits (e.g. ORD1001).",
                intent, steps, sources, start,
            )

        # For HYBRID queries about returns, use the chained tool
        query_lower = query.lower()
        if intent == "HYBRID" and any(kw in query_lower for kw in ["return", "refund", "exchange", "eligible"]):
            result = tools.check_return_eligibility(order_id)
            if result["success"]:
                context_parts.append(
                    f"Return Eligibility Check for {order_id}:\n"
                    f"  Eligible: {result.get('eligible', 'N/A')}\n"
                    f"  Reason: {result['reason']}\n"
                    f"  Order Details: {json.dumps(result.get('order_data', {}), indent=2)}"
                )
                steps[-1]["status"] = "done"
                steps[-1]["result"] = result["reason"]
                sources.append({"type": "order_data", "order_id": order_id})
            else:
                steps[-1]["status"] = "error"
                steps[-1]["result"] = result["error"]
                return _build_response(result["error"], intent, steps, sources, start)
        else:
            result = tools.get_order_details(order_id)
            if result["success"]:
                context_parts.append(
                    f"Order Details for {order_id}:\n{json.dumps(result['data'], indent=2)}"
                )
                steps[-1]["status"] = "done"
                steps[-1]["result"] = f"Found: {result['data']['product']} — {result['data']['status']}"
                sources.append({"type": "order_data", "order_id": order_id})
            else:
                steps[-1]["status"] = "error"
                steps[-1]["result"] = result["error"]
                return _build_response(result["error"], intent, steps, sources, start)

    # ── Step 2b: RAG retrieval ───────────────────────────────────────
    if intent in ("KNOWLEDGE", "HYBRID"):
        steps.append({"step": "Searching policy documents...", "status": "running"})
        retrieved = rag.retrieve(query, top_k=3)

        if retrieved:
            for chunk in retrieved:
                context_parts.append(
                    f"[Policy: {chunk['source']} — {chunk['section']}]\n{chunk['content']}"
                )
                sources.append({
                    "type": "policy",
                    "source": chunk["source"],
                    "section": chunk["section"],
                    "score": chunk["score"],
                })
            steps[-1]["status"] = "done"
            steps[-1]["result"] = f"Retrieved {len(retrieved)} relevant policy chunks"
        else:
            steps[-1]["status"] = "done"
            steps[-1]["result"] = "No relevant policy documents found"

    # ── Step 2c: Unknown intent ──────────────────────────────────────
    if intent == "UNKNOWN":
        return _build_response(
            "I'm sorry, I can only help with questions about our e-commerce store - "
            "things like order status, shipping, returns, payments, and account support. "
            "Could you rephrase your question?",
            intent, steps, sources, start,
        )

    # ── Step 3: Generate answer ──────────────────────────────────────
    steps.append({"step": "Generating answer...", "status": "running"})
    context = "\n\n".join(context_parts) if context_parts else "No relevant context found."
    answer = generate_answer(query, context)
    steps[-1]["status"] = "done"
    steps[-1]["result"] = "Answer generated"

    return _build_response(answer, intent, steps, sources, start)


def _build_response(
    answer: str,
    route: str,
    steps: List[Dict],
    sources: List[Dict],
    start: float,
) -> Dict:
    return {
        "answer": answer,
        "route": route,
        "reasoning_steps": steps,
        "sources": sources,
        "latency_ms": round((time.time() - start) * 1000),
    }


# ─────────────────────────────────────────────────────────────────────────
# FastAPI Web Server
# ─────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Mini Support Agent", version="1.0.0")


@app.on_event("startup")
async def startup():
    """Initialise the RAG index on server start."""
    print("\n[*] Mini Support Agent starting up...")
    rag.build_index()
    print("[OK] Ready to serve!\n")


@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    query = body.get("query", "").strip()
    if not query:
        return JSONResponse({"error": "Empty query"}, status_code=400)
    result = process_query(query)
    return JSONResponse(result)


@app.get("/api/orders")
async def get_orders():
    orders = tools.list_all_orders()
    return JSONResponse(orders)


@app.get("/api/health")
async def health():
    return JSONResponse({"status": "ok", "provider": "gemini"})


# Serve static frontend
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


# ─────────────────────────────────────────────────────────────────────────
# CLI Mode
# ─────────────────────────────────────────────────────────────────────────

def run_cli(query: str):
    """Run a single query in CLI mode and print the result."""
    print(f"\n{'─' * 60}")
    print(f"  Query: {query}")
    print(f"{'─' * 60}\n")

    rag.build_index()
    result = process_query(query)

    # Print reasoning steps
    print("  [Reasoning Trace]")
    for step in result["reasoning_steps"]:
        icon = "[OK]" if step["status"] == "done" else "[!!]"
        print(f"    {icon} {step['step']}")
        if step.get("result"):
            print(f"        -> {step['result']}")

    print(f"\n  Route: {result['route']}")
    print(f"  Latency: {result['latency_ms']}ms")

    print(f"\n  Answer:")
    print(f"  {'-' * 56}")
    for line in result["answer"].split("\n"):
        print(f"    {line}")
    print(f"  {'-' * 56}\n")


def run_interactive_cli():
    """Run an interactive CLI session."""
    print("\n" + "=" * 60)
    print("  Mini Support Agent - Interactive Mode")
    print("  Type your question, or 'quit' to exit.")
    print("=" * 60)

    rag.build_index()

    while True:
        try:
            query = input("\n  You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\n  Goodbye!")
            break

        if not query:
            continue
        if query.lower() in ("quit", "exit", "q"):
            print("\n  Goodbye!")
            break

        result = process_query(query)

        # Print reasoning trace
        print("\n  [Reasoning]")
        for step in result["reasoning_steps"]:
            icon = "[OK]" if step["status"] == "done" else "[!!]"
            print(f"    {icon} {step['step']}")
            if step.get("result"):
                print(f"        -> {step['result']}")

        print(f"\n  Route: {result['route']}  |  Latency: {result['latency_ms']}ms")

        print(f"\n  Agent:")
        for line in result["answer"].split("\n"):
            print(f"    {line}")


# ─────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI single-query mode: python app.py "your question here"
        user_query = " ".join(sys.argv[1:])

        if user_query == "--web":
            uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
        elif user_query == "--interactive":
            run_interactive_cli()
        else:
            run_cli(user_query)
    else:
        # Default: start web server
        print("\n  Tip: Run 'python app.py --interactive' for CLI chat mode")
        print("  Tip: Run 'python app.py \"your question\"' for single query\n")
        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
