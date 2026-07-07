# Mini Support Agent 🤖

A production-quality AI-powered customer support agent for an e-commerce seller. Built as part of an AI Engineering Intern take-home assignment.

The agent intelligently routes customer queries between **policy knowledge retrieval (RAG)** and **deterministic order data lookup**, with support for hybrid/chained questions that require both.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?logo=fastapi)
![FAISS](https://img.shields.io/badge/FAISS-Vector_Search-orange)
![Gemini](https://img.shields.io/badge/Gemini_2.0-Flash-yellow?logo=google)

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌──────────────────┐
│   LLM Router     │   Classifies intent:
│  (Gemini Flash)  │   KNOWLEDGE / ORDER_DATA / HYBRID / UNKNOWN
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│  RAG   │ │ CSV Tool │
│ Engine │ │  Lookup  │
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
┌──────────────────┐
│  LLM Answer Gen  │   Combines context + generates response
│  (Gemini Flash)  │
└──────────────────┘
    │
    ▼
  Answer + Reasoning Trace
```

### Key Design Decisions

1. **Routing via structured classification prompt** — Not one giant prompt. The router classifies intent first, then only the relevant retrieval path is invoked. This is more modular, testable, and cost-efficient.

2. **Local embeddings (sentence-transformers `all-MiniLM-L6-v2`)** — Runs on CPU, zero API cost, no rate limits, ~384-dim vectors. Ideal for a small policy corpus of ~15 chunks.

3. **FAISS `IndexFlatIP`** — Brute-force inner-product search on normalised vectors (= cosine similarity). Chosen because the corpus is tiny (~15 vectors), so approximate methods like IVF/HNSW add complexity without benefit.

4. **Deterministic tool calls for order data** — The LLM never guesses order details. All order data comes directly from pandas CSV queries, guaranteeing correctness.

5. **Resilient Offline Fallback (Anti-Fragile Design)** — If the external LLM API is rate-limited (HTTP 429), offline, or encounters connection issues, the router gracefully degrades. It uses keyword heuristics to classify intent and compiles the final answer directly from the retrieved database details and FAISS policy chunks. The system never crashes with a 500 error, guaranteeing high uptime.

---

## 📂 Project Structure

```
mini-support-agent/
├── app.py              # Main orchestrator (CLI + FastAPI)
├── router.py           # LLM-based query router + answer generator
├── rag.py              # Embedding + FAISS indexing + retrieval
├── tools.py            # Deterministic order lookup functions
├── data_loader.py      # CSV + Markdown loading & chunking
├── requirements.txt    # Python dependencies
├── test_cases.md       # 10 test questions (expected vs actual)
├── .env.example        # Environment variable template
├── README.md           # This file
│
├── data/
│   ├── orders.csv              # 20 mock orders
│   └── docs/
│       ├── shipping_policy.md
│       ├── returns_and_refunds.md
│       ├── payment_and_pricing.md
│       └── account_and_support.md
│
├── static/             # Web UI (served by FastAPI)
│   ├── index.html
│   ├── app.css
│   └── app.js
│
└── vector_db/          # Auto-generated FAISS index
    ├── faiss.index
    └── chunks.pkl
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- A Gemini API key ([get one free](https://aistudio.google.com/apikey)) or OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Revanth-4233/mini-support-agent.git
cd mini-support-agent

# Install dependencies
pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and paste your API key
```

### Running the Agent

**Web UI (recommended):**
```bash
python app.py
# Open http://localhost:8000
```

**Interactive CLI:**
```bash
python app.py --interactive
```

**Single query:**
```bash
python app.py "What is the return policy for electronics?"
```

---

## 🔍 How It Works

### Chunking & Retrieval Strategy

Policy documents are split by `##` Markdown headers, so each chunk covers one policy topic (e.g., "Return Window", "COD Charges"). The parent `#` heading is prepended to every chunk so the retriever retains document-level context.

This produces ~15 focused chunks, each typically 3-8 lines. This is small enough that every chunk fits comfortably within the LLM context window, but specific enough for precise retrieval.

### Vector Store Choice

FAISS (`IndexFlatIP`) was chosen for its simplicity:
- The corpus has only ~15 chunks — any approximate index would be overkill.
- Zero infrastructure — the index is a single file on disk.
- Normalised vectors + inner product = exact cosine similarity.

### Routing Logic

The router sends the user query to the LLM with a structured classification prompt that asks for a JSON response:

```json
{"intent": "KNOWLEDGE|ORDER_DATA|HYBRID|UNKNOWN", "order_id": "...", "reasoning": "..."}
```

The LLM determines whether the question is about policies, a specific order, or both. A keyword-based fallback handles cases where the LLM response can't be parsed.

### Hybrid (Chained) Queries

For queries like *"Can I still return order ORD1004?"*, the system:
1. Looks up the order → category: Electronics, delivered: 2026-06-25
2. Applies the policy → Electronics have a 3-day return window
3. Calculates → Today is past the window → Not eligible

This is implemented in `tools.check_return_eligibility()` which combines deterministic order data with hardcoded policy rules.

---

## 🧪 Test Cases

See [`test_cases.md`](test_cases.md) for 10 test questions covering:
- **3 Knowledge queries** — return policy, shipping costs, payment methods
- **2 Order data queries** — order status, order details
- **2 Hybrid queries** — return eligibility (expired window, undelivered order)
- **3 Edge cases** — invalid order ID, no answer in docs, out-of-scope question

---

## 🧠 Model & Cost Choice

| Component | Model | Why |
|-----------|-------|-----|
| **Embeddings** | `all-MiniLM-L6-v2` (local) | Free, fast, no API calls. Good quality for short text. |
| **Router + Answer Gen** | Gemini 2.0 Flash | Free tier available, fast (~1-2s), good instruction following. |

**Cost estimate per query**: ~$0 (local embeddings) + ~$0.0001 (2 Gemini Flash calls × ~500 tokens each at free tier) = **effectively free**.

**Latency**: ~1-3 seconds end-to-end (dominated by 2 LLM API calls).

---

## 💡 What I'd Improve With More Time

- **Streaming responses** — Use SSE or WebSockets for real-time token streaming in the web UI.
- **Conversation memory** — Add multi-turn context so users can ask follow-up questions.
- **Automated test runner** — A Python script that runs all test cases programmatically and generates a pass/fail report.
- **Better chunking** — Use semantic chunking or overlapping windows instead of header-based splitting.
- **Observability** — Add structured logging with request IDs for debugging production issues.
- **Deployment** — Dockerize and deploy to Cloud Run / Railway for a live demo.

---

## 📝 License

This project was built as a take-home assignment. Feel free to reference the architecture for learning purposes.
