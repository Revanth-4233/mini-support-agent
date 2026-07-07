"""
rag.py — Retrieval-Augmented Generation engine.

Design Decisions:
  • Embedding model: all-MiniLM-L6-v2 (sentence-transformers).
    - Runs locally → zero API cost, no rate limits.
    - 384-dim vectors, fast inference on CPU.
    - Good semantic quality for short policy text.
  • Vector store: FAISS IndexFlatIP (inner-product on L2-normalised vectors
    = cosine similarity). Chosen because:
    - The corpus is tiny (~15 chunks) so brute-force is fine.
    - Zero infrastructure — just a file on disk.
    - Easy to rebuild on every startup if needed.
  • The index is persisted to vector_db/ so it's only built once.
"""

import numpy as np
import faiss
import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer
from typing import List, Dict

from data_loader import load_documents

# ── Paths ────────────────────────────────────────────────────────────────
VECTOR_DB_DIR = Path(__file__).parent / "vector_db"
INDEX_PATH = VECTOR_DB_DIR / "faiss.index"
CHUNKS_PATH = VECTOR_DB_DIR / "chunks.pkl"

# ── Model ────────────────────────────────────────────────────────────────
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

_model: SentenceTransformer | None = None
_index: faiss.Index | None = None
_chunks: List[Dict[str, str]] | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the sentence-transformer embedding model."""
    global _model
    if _model is None:
        print("  Loading embedding model...")
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print("  [OK] Embedding model ready.")
    return _model


# ── Index Management ────────────────────────────────────────────────────
def build_index(force_rebuild: bool = False) -> None:
    """
    Build (or load from disk) the FAISS index over policy document chunks.
    """
    global _index, _chunks

    VECTOR_DB_DIR.mkdir(exist_ok=True)

    # Load from disk if already built
    if not force_rebuild and INDEX_PATH.exists() and CHUNKS_PATH.exists():
        _index = faiss.read_index(str(INDEX_PATH))
        with open(CHUNKS_PATH, "rb") as f:
            _chunks = pickle.load(f)
        print(f"  [OK] Loaded existing FAISS index ({_index.ntotal} vectors).")
        return

    # Build from scratch
    print("  Building FAISS index from policy documents...")
    documents = load_documents()
    model = _get_model()

    texts = [doc["content"] for doc in documents]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    embeddings = np.asarray(embeddings, dtype=np.float32)

    dimension = embeddings.shape[1]
    _index = faiss.IndexFlatIP(dimension)  # cosine sim on normalised vectors
    _index.add(embeddings)

    _chunks = documents

    # Persist
    faiss.write_index(_index, str(INDEX_PATH))
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(_chunks, f)

    print(f"  [OK] FAISS index built and saved ({_index.ntotal} vectors, {dimension}-dim).")


# ── Retrieval ────────────────────────────────────────────────────────────
def retrieve(query: str, top_k: int = 3) -> List[Dict]:
    """
    Retrieve the top-k most relevant policy chunks for a user query.

    Returns list of dicts with keys: content, source, section, score.
    """
    global _index, _chunks
    if _index is None:
        build_index()

    model = _get_model()
    query_vec = model.encode([query], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype=np.float32)

    scores, indices = _index.search(query_vec, top_k)

    results: List[Dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if 0 <= idx < len(_chunks):
            results.append({
                "content": _chunks[idx]["content"],
                "source": _chunks[idx]["source"],
                "section": _chunks[idx]["section"],
                "score": round(float(score), 4),
            })

    return results
