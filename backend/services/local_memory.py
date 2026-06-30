"""
Local, Cognee-independent vector memory.

This is the "Fast Mode" backend: chunks get embedded locally via fastembed
(no API calls, no LLM, no rate limits) and stored as numpy arrays on disk.
Retrieval is pure cosine similarity search.

This exists because Cognee's add() + cognify() pipeline bundles vector
storage as a *downstream output* of LLM-based graph extraction — there's
no way to get searchable embeddings out of Cognee without at least one
LLM call per chunk. For demo reliability we bypass that entirely here.

"Full Graph Mode" (graph_mode=True in cognee_service.py) still uses real
Cognee end-to-end, including cognify(), when API quota allows.
"""
import os
import json
import logging
import numpy as np
from pathlib import Path
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

STORE_DIR = Path(os.environ.get("LOCAL_MEMORY_DIR", "./local_memory_store"))
STORE_DIR.mkdir(parents=True, exist_ok=True)

_embedder: TextEmbedding | None = None


def _get_embedder() -> TextEmbedding:
    """Lazy-load the embedding model once per process."""
    global _embedder
    if _embedder is None:
        logger.info("[LOCAL] Loading fastembed model (sentence-transformers/all-MiniLM-L6-v2)...")
        _embedder = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        logger.info("[LOCAL] Embedding model loaded")
    return _embedder


def _dataset_path(dataset: str) -> Path:
    return STORE_DIR / f"{dataset}.json"


async def store_chunks(chunks: list[str], dataset: str) -> int:
    """
    Embed and store a list of text chunks locally. No LLM calls.
    Returns count of chunks stored.
    """
    chunks = [c for c in chunks if c.strip()]
    if not chunks:
        logger.info(f"[LOCAL] No non-empty chunks to store for dataset '{dataset}'")
        return 0

    logger.info(f"[LOCAL] Embedding {len(chunks)} chunks for dataset '{dataset}'...")
    embedder = _get_embedder()

    # fastembed returns a generator of numpy arrays
    embeddings = list(embedder.embed(chunks))
    logger.info(f"[LOCAL] Embedded {len(embeddings)} chunks")

    # Load existing store (append mode, so re-ingesting the same dataset adds on top)
    existing = _load_dataset(dataset)
    existing_chunks = existing.get("chunks", [])
    existing_vectors = existing.get("vectors", [])

    new_chunks = existing_chunks + chunks
    new_vectors = existing_vectors + [e.tolist() for e in embeddings]

    _save_dataset(dataset, new_chunks, new_vectors)
    logger.info(f"[LOCAL] Stored {len(chunks)} new chunks (total now {len(new_chunks)}) for dataset '{dataset}'")
    return len(chunks)


def _load_dataset(dataset: str) -> dict:
    path = _dataset_path(dataset)
    if not path.exists():
        return {"chunks": [], "vectors": []}
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"[LOCAL] Failed to load dataset '{dataset}': {e}")
        return {"chunks": [], "vectors": []}


def _save_dataset(dataset: str, chunks: list[str], vectors: list[list[float]]):
    path = _dataset_path(dataset)
    with open(path, "w") as f:
        json.dump({"chunks": chunks, "vectors": vectors}, f)


async def search(query: str, dataset: str, top_k: int = 6) -> list[dict]:
    """
    Cosine similarity search over locally stored chunks. No LLM call.
    Returns list of {text, score} dicts, highest score first.
    """
    data = _load_dataset(dataset)
    chunks = data.get("chunks", [])
    vectors = data.get("vectors", [])

    if not chunks:
        logger.info(f"[LOCAL] search() — no chunks stored for dataset '{dataset}'")
        return []

    embedder = _get_embedder()
    query_vec = list(embedder.embed([query]))[0]

    matrix = np.array(vectors)
    query_arr = np.array(query_vec)

    # Cosine similarity = dot product / (norm * norm), vectors from fastembed are usually
    # already normalized, but we normalize defensively anyway.
    matrix_norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix_norms[matrix_norms == 0] = 1e-10
    query_norm = np.linalg.norm(query_arr)
    query_norm = query_norm if query_norm != 0 else 1e-10

    normalized_matrix = matrix / matrix_norms
    normalized_query = query_arr / query_norm

    scores = normalized_matrix @ normalized_query  # shape (n,)
    top_indices = np.argsort(scores)[::-1][:top_k]

    results = [
        {"text": chunks[i], "score": float(scores[i])}
        for i in top_indices
    ]
    logger.info(f"[LOCAL] search() returned {len(results)} results for dataset '{dataset}'")
    return results


async def delete_dataset(dataset: str) -> bool:
    """Remove a dataset's stored chunks/vectors from disk."""
    path = _dataset_path(dataset)
    if path.exists():
        path.unlink()
        logger.info(f"[LOCAL] Deleted dataset '{dataset}'")
        return True
    return False


async def dataset_stats(dataset: str) -> dict:
    """Return chunk count and rough size info for a dataset."""
    data = _load_dataset(dataset)
    return {
        "chunks": len(data.get("chunks", [])),
    }
