"""
data_loader.py — Loads and preprocesses the orders CSV and policy Markdown documents.

Design Decisions:
  • Markdown documents are split by ## headers so each chunk covers a single
    policy topic (e.g. "Return Window", "COD Charges"). This keeps chunks
    focused and improves retrieval precision.
  • The parent # heading is prepended to every chunk so the search index never
    loses the document-level context (e.g. "Shipping Policy").
  • Orders CSV is loaded once via pandas and cached in-module.
"""

import pandas as pd
from pathlib import Path
from typing import List, Dict

# ── Paths ────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
ORDERS_CSV = DATA_DIR / "orders.csv"
DOCS_DIR = DATA_DIR / "docs"


# ── Orders ───────────────────────────────────────────────────────────────
_orders_df: pd.DataFrame | None = None


def load_orders() -> pd.DataFrame:
    """Load and cache the orders CSV. Returns a pandas DataFrame."""
    global _orders_df
    if _orders_df is None:
        _orders_df = pd.read_csv(ORDERS_CSV)
    return _orders_df


# ── Policy Documents ────────────────────────────────────────────────────
def load_documents() -> List[Dict[str, str]]:
    """
    Load all Markdown policy files and split them into section-level chunks.

    Returns a list of dicts:
        { "content": str, "source": str, "section": str }
    """
    documents: List[Dict[str, str]] = []
    for md_file in sorted(DOCS_DIR.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        chunks = _split_by_headers(text, source=md_file.stem)
        documents.extend(chunks)
    return documents


def _split_by_headers(content: str, source: str) -> List[Dict[str, str]]:
    """
    Split a Markdown string by ## headers.

    Each chunk includes all bullet points under a single ## section,
    prefixed with the top-level # heading for context.
    """
    lines = content.split("\n")
    chunks: List[Dict[str, str]] = []

    doc_title = ""          # The top-level # heading
    current_section = ""    # The current ## heading
    current_lines: list = []

    for line in lines:
        if line.startswith("# ") and not line.startswith("## "):
            # Top-level heading — remember it but don't start a new chunk yet
            doc_title = line.lstrip("# ").strip()
            current_section = doc_title
            current_lines.append(line)
        elif line.startswith("## "):
            # Flush the previous chunk
            if current_lines:
                chunks.append({
                    "content": "\n".join(current_lines).strip(),
                    "source": source,
                    "section": current_section,
                })
            current_section = line.lstrip("# ").strip()
            # Start the new chunk with the doc title for context
            current_lines = [f"# {doc_title}", line]
        else:
            current_lines.append(line)

    # Flush the last chunk
    if current_lines:
        chunks.append({
            "content": "\n".join(current_lines).strip(),
            "source": source,
            "section": current_section,
        })

    # Filter out very short chunks (e.g. title-only fragments)
    return [c for c in chunks if len(c["content"]) > 50]
