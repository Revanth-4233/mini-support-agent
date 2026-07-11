"""
router.py — LLM-powered query router + answer generator.

Design Decisions:
  • Routing is done via a structured classification prompt, NOT by stuffing
    everything into one giant prompt.  This gives us an explicit, auditable
    routing decision before any retrieval or lookup happens.
  • Supports two LLM providers (Gemini / OpenAI), selectable via .env.
  • The router classifies each query into one of four intents:
      KNOWLEDGE  — policy question → RAG
      ORDER_DATA — order-specific question → CSV lookup
      HYBRID     — needs both (e.g. "Can I return ORD1004?")
      UNKNOWN    — out-of-scope
"""

import os
import re
import json
from typing import Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()


# ─────────────────────────────────────────────────────────────────────────
# LLM Abstraction
# ─────────────────────────────────────────────────────────────────────────

def _call_gemini(prompt: str, system_prompt: str | None = None) -> str:
    """Call Google Gemini API."""
    import google.generativeai as genai
    from google.api_core.retry import Retry

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not set.  Copy .env.example → .env "
            "and paste your Gemini API key."
        )
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        system_instruction=system_prompt,
    )
    
    # Performance Optimization: Enforce a fast timeout (5.0s) and disable 
    # automatic backoff retries. If the API key is rate-limited or offline, 
    # we want to fail fast (within 1s) and trigger our local fallback 
    # immediately, preventing the UI chat bubble from hanging.
    fast_options = {
        "timeout": 5.0,
        "retry": Retry(predicate=lambda e: False),
    }
    response = model.generate_content(prompt, request_options=fast_options)
    return response.text


def _call_openai(prompt: str, system_prompt: str | None = None) -> str:
    """Call OpenAI Chat Completions API."""
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your_openai_api_key_here":
        raise ValueError(
            "OPENAI_API_KEY is not set.  Copy .env.example → .env "
            "and paste your OpenAI API key."
        )
    client = OpenAI(api_key=api_key)
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0,
        timeout=5.0,
    )
    return response.choices[0].message.content


def call_llm(prompt: str, system_prompt: str | None = None) -> str:
    """Route to the configured LLM provider."""
    if LLM_PROVIDER == "openai":
        return _call_openai(prompt, system_prompt)
    elif LLM_PROVIDER == "gemini":
        return _call_gemini(prompt, system_prompt)
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: '{LLM_PROVIDER}'")


# ─────────────────────────────────────────────────────────────────────────
# Query Classification (Router)
# ─────────────────────────────────────────────────────────────────────────

ROUTER_SYSTEM_PROMPT = """\
You are an intent classifier for an e-commerce customer support agent.

Given a user query, classify it into EXACTLY ONE of these categories:
  • KNOWLEDGE  — The question is about company policies (shipping, returns, \
refunds, payments, pricing, account support, loyalty). It does NOT mention \
a specific order ID.
  • ORDER_DATA — The question asks about a specific order (status, tracking, \
details). It mentions or implies a specific order ID like ORD1001.
  • HYBRID     — The question requires BOTH order data AND policy knowledge \
to answer. Example: "Can I return order ORD1004?" needs the order's category \
and delivery date plus the return policy.
  • UNKNOWN    — The question is completely unrelated to e-commerce support \
(e.g. weather, coding, jokes).

Respond with ONLY a JSON object:
{"intent": "<KNOWLEDGE|ORDER_DATA|HYBRID|UNKNOWN>", "order_id": "<extracted order ID or null>", "reasoning": "<brief explanation>"}
"""


def classify_query(query: str) -> Dict:
    """
    Classify a user query into an intent category.

    Returns:
        { "intent": str, "order_id": str | None, "reasoning": str }
    """
    try:
        raw = call_llm(query, system_prompt=ROUTER_SYSTEM_PROMPT)
    except Exception as e:
        print(f"  [Warning] API call failed: {e}. Falling back to heuristic classifier.")
        fallback = _keyword_fallback(query)
        fallback["reasoning"] = f"API Rate-limit fallback: {fallback.get('reasoning')}"
        return fallback

    # Extract JSON from the response (handle markdown code fences)
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if json_match:
        try:
            result = json.loads(json_match.group())
            # Normalise
            result["intent"] = result.get("intent", "UNKNOWN").upper()
            if result["intent"] not in ("KNOWLEDGE", "ORDER_DATA", "HYBRID", "UNKNOWN"):
                result["intent"] = "UNKNOWN"
            
            # Robustly parse and normalise order_id
            order_id = result.get("order_id")
            if isinstance(order_id, str):
                order_id_clean = order_id.strip().upper()
                if order_id_clean in ("NULL", "NONE", "", "UNDEFINED"):
                    result["order_id"] = None
                else:
                    # Look for ORDXXXX format with optional spaces, e.g. "ORD 1004" -> "ORD1004"
                    m = re.search(r"ORD\s*\d{4}", order_id_clean)
                    result["order_id"] = m.group().replace(" ", "") if m else None
            elif order_id is None:
                result["order_id"] = None
            else:
                # If it's a number or something else
                result["order_id"] = str(order_id).strip()
            
            return result
        except json.JSONDecodeError:
            pass

    # Fallback: try keyword heuristics
    return _keyword_fallback(query)


def _keyword_fallback(query: str) -> Dict:
    """Simple rule-based fallback when the LLM response can't be parsed."""
    query_upper = query.upper()
    order_match = re.search(r"ORD\s*\d{4}", query_upper)
    order_id = order_match.group().replace(" ", "") if order_match else None

    # If an order ID is mentioned
    if order_id:
        # Check if it also asks about policy
        policy_keywords = [
            "return", "refund", "cancel", "exchange", "policy",
            "shipping", "payment", "eligible",
        ]
        if any(kw in query.lower() for kw in policy_keywords):
            return {"intent": "HYBRID", "order_id": order_id, "reasoning": "Keyword fallback: order ID + policy keyword detected"}
        return {"intent": "ORDER_DATA", "order_id": order_id, "reasoning": "Keyword fallback: order ID detected"}

    # Policy keywords
    policy_keywords = [
        "return", "refund", "ship", "delivery", "payment", "cancel",
        "exchange", "policy", "support", "loyalty", "coupon", "cod",
        "tracking", "account", "gst", "invoice", "price", "password",
        "reset", "login", "register", "signin", "sign-in", "user",
        "profile", "contact", "email", "phone", "help", "whatsapp",
        "gift", "wrap", "wrapping", "pack", "packaging", "card",
        "offer", "discount", "sale", "charge", "fee", "cost", "price",
    ]
    if any(kw in query.lower() for kw in policy_keywords):
        return {"intent": "KNOWLEDGE", "order_id": None, "reasoning": "Keyword fallback: policy keywords detected"}

    return {"intent": "UNKNOWN", "order_id": None, "reasoning": "Keyword fallback: no recognizable intent"}


# ─────────────────────────────────────────────────────────────────────────
# Answer Generation
# ─────────────────────────────────────────────────────────────────────────

ANSWER_SYSTEM_PROMPT = """\
You are a friendly, professional customer support agent for an Indian \
e-commerce company.  Answer the customer's question accurately based ONLY \
on the context provided below.

Rules:
  1. Be concise but thorough — use bullet points when listing details.
  2. If the context does not contain enough information to answer, say so \
honestly. Do NOT make up facts.
  3. When referencing order data, present it in a clear, structured format.
  4. Use ₹ for Indian Rupee amounts.
  5. Be warm and helpful in tone.
"""


def generate_answer(query: str, context: str) -> str:
    """
    Generate a final customer-facing answer given the query and
    assembled context (policy chunks and/or order data).
    """
    prompt = f"""Customer Question: {query}

--- Context ---
{context}
--- End Context ---

Please answer the customer's question based on the context above."""

    try:
        return call_llm(prompt, system_prompt=ANSWER_SYSTEM_PROMPT)
    except Exception as e:
        print(f"  [Warning] API call failed: {e}. Generating offline fallback response.")
        return _generate_offline_answer(query, context)


def _generate_offline_answer(query: str, context: str) -> str:
    """Synthesize a clean answer directly from context when LLM is rate-limited."""
    lines = []
    lines.append("⚠️ **Note**: The LLM service is currently busy or rate-limited. The system has automatically retrieved the verified database details below for your query:\n")
    
    for chunk in context.split("\n\n"):
        chunk = chunk.strip()
        if not chunk:
            continue
            
        if "Order Details for" in chunk or "Return Eligibility Check for" in chunk:
            lines.append(f"### {chunk.splitlines()[0]}")
            for line in chunk.splitlines()[1:]:
                line = line.strip().replace('"', '').replace(',', '')
                if line:
                    lines.append(f"- **{line}**" if ":" in line else f"- {line}")
        elif "[Policy:" in chunk:
            header_match = re.search(r"\[Policy:\s*(.*?)\s*—\s*(.*?)\]", chunk)
            if header_match:
                source, section = header_match.groups()
                lines.append(f"### {source.replace('_', ' ').title()} - {section}")
            content_lines = chunk.split("\n", 1)[1] if "\n" in chunk else chunk
            for line in content_lines.splitlines():
                line = line.strip()
                line = re.sub(r"^#+\s+", "", line)
                if line:
                    lines.append(f"  {line}")
            lines.append("")
        else:
            lines.append(chunk)
            
    return "\n".join(lines)
