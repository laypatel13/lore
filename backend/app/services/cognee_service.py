import os
import logging
import cognee
from cognee.modules.search.types import SearchType
from app.core.config import settings
from app.models.schemas import Source

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────
# DEMO MODE SWITCH
# True  -> fast path: add() only, NO LLM calls, instant ingestion (default)
# False -> full path: add() + cognify() + improve(), builds real graph,
#          needs LLM headroom (use for small repos / when you have quota)
# Toggle this per-request via IngestRequest.graph_mode (see ingest.py),
# or change the default here.
# ──────────────────────────────────────────────────────────────────────────
DEFAULT_GRAPH_MODE = False


async def setup():
    """
    Configure Cognee on startup to use local Ollama for both LLM and
    embeddings. cognify() (used only in Full Graph Mode) issues many
    sequential LLM calls per document, which blew through Groq's free-tier
    rate limit and meant graph_mode=True had never actually completed.
    Ollama has no rate limit, so this is the reliable engine for that path.
    Chat synthesis (services/synthesis.py) still uses Groq directly — this
    change does not affect it.
    """
    os.environ["LLM_PROVIDER"] = "ollama"
    os.environ["LLM_MODEL"] = "llama3.1:8b"  # no "ollama/" prefix — Cognee's OllamaAPIAdapter forwards this literally to Ollama's API
    os.environ["LLM_ENDPOINT"] = "http://localhost:11434/v1"
    os.environ["LLM_API_KEY"] = "ollama"  # dummy value, Cognee requires non-empty
    os.environ["EMBEDDING_PROVIDER"] = "ollama"
    os.environ["EMBEDDING_MODEL"] = "nomic-embed-text"
    os.environ["EMBEDDING_ENDPOINT"] = "http://localhost:11434/api/embed"
    os.environ["EMBEDDING_DIMENSIONS"] = "768"
    os.environ["HUGGINGFACE_TOKENIZER"] = "nomic-ai/nomic-embed-text-v1.5"
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"
    logger.info("[COGNEE] Setup complete (Ollama: llama3.1:8b + nomic-embed-text)")


async def remember_chunks(chunks: list[str], dataset: str, graph_mode: bool = DEFAULT_GRAPH_MODE) -> int:
    """
    Ingest a list of text chunks individually into Cognee.
    graph_mode=False (default): add() only — local, instant, no LLM calls.
    graph_mode=True: also runs cognify() — builds LLM-extracted graph relationships.
    Returns the count of successfully stored chunks.
    """
    stored = 0
    failed = 0
    logger.info(f"[COGNEE] Ingesting {len(chunks)} chunks into dataset '{dataset}' (graph_mode={graph_mode})")

    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
        try:
            await cognee.add(chunk, dataset_name=dataset)
            stored += 1
            if stored % 20 == 0:
                logger.info(f"[COGNEE] Added {stored}/{len(chunks)} chunks...")
        except Exception as e:
            failed += 1
            logger.error(f"[COGNEE] ERROR adding chunk {i}: {e}")

    logger.info(f"[COGNEE] add() complete — stored={stored}, failed={failed}")

    if not graph_mode:
        logger.info(f"[COGNEE] graph_mode=False — skipping cognify(), vector search only")
        return stored

    logger.info(f"[COGNEE] graph_mode=True — running cognify() to build graph...")
    try:
        await cognee.cognify(datasets=[dataset])
        logger.info(f"[COGNEE] cognify() complete")
    except Exception as e:
        logger.error(f"[COGNEE] cognify() ERROR (continuing without graph): {e}")

    return stored


async def remember(text: str, dataset: str, graph_mode: bool = DEFAULT_GRAPH_MODE) -> int:
    """
    Ingest a single text blob (for metadata/commits/PRs/issues).
    graph_mode=False (default): add() only.
    graph_mode=True: also runs cognify().
    Returns 1 if successful.
    """
    logger.info(f"[COGNEE] remember() single blob, len={len(text)}, dataset='{dataset}' (graph_mode={graph_mode})")
    try:
        await cognee.add(text, dataset_name=dataset)
        logger.info(f"[COGNEE] add() OK")
        if graph_mode:
            await cognee.cognify(datasets=[dataset])
            logger.info(f"[COGNEE] cognify() OK")
        else:
            logger.info(f"[COGNEE] graph_mode=False — skipping cognify()")
        return 1
    except Exception as e:
        logger.error(f"[COGNEE] remember() ERROR: {e}")
        raise


async def recall(question: str, dataset: str, graph_mode: bool = DEFAULT_GRAPH_MODE) -> tuple[str, list[Source]]:
    """
    Query Cognee memory.
    graph_mode=False (default): forces SearchType.CHUNKS — pure vector
        similarity search over stored chunks. No LLM call, no graph needed.
    graph_mode=True: forces SearchType.GRAPH_COMPLETION — full graph
        traversal + LLM completion (needs cognify() to have run first).
    Without this explicit query_type, Cognee defaults to GRAPH_COMPLETION
    regardless of how data was ingested, which silently triggers an LLM
    call even when no graph exists — that was the original bug.
    """
    query_type = SearchType.GRAPH_COMPLETION if graph_mode else SearchType.CHUNKS
    logger.info(f"[COGNEE] recall() question={question!r}, dataset='{dataset}', query_type={query_type}")

    results = await cognee.recall(
        query_text=question,
        datasets=[dataset],
        query_type=query_type,
    )

    if not results:
        logger.info(f"[COGNEE] recall() returned no results")
        return "No relevant context found in memory.", []

    sources = []
    answer_parts = []

    for r in results[:6]:
        text = getattr(r, "text", None) or str(r)
        answer_parts.append(text)
        sources.append(Source(
            type=getattr(r, "type", "document"),
            id=str(getattr(r, "id", "unknown")),
            text=text[:200],
        ))

    logger.info(f"[COGNEE] recall() returned {len(results)} results, using top {len(sources)}")
    answer = "\n\n".join(answer_parts)
    return answer, sources


async def improve(dataset: str, graph_mode: bool = DEFAULT_GRAPH_MODE):
    """
    Enrich and re-weight the knowledge graph. Needs LLM headroom — only
    runs if graph_mode is True. In demo mode this is a safe no-op.
    """
    if not graph_mode:
        logger.info(f"[COGNEE] improve() skipped — graph_mode=False")
        return
    logger.info(f"[COGNEE] improve() dataset='{dataset}'")
    try:
        await cognee.improve()
        logger.info(f"[COGNEE] improve() OK")
    except Exception as e:
        logger.error(f"[COGNEE] improve() ERROR (non-fatal): {e}")


async def get_graph(dataset: str) -> tuple[list, list]:
    """
    Retrieve the raw Cognee graph (nodes + edges) for visualization.
    Only meaningful for repos ingested with graph_mode=True — Fast Mode
    never calls cognify(), so there's no graph to fetch.

    Note: Cognee's local graph engine (ladybug/kuzu) does not filter
    get_graph_data() by dataset — it returns the full local graph store.
    Fine for a single-repo demo; if multiple graph_mode repos are ingested
    in the same session, this will return their combined graph.
    """
    from cognee.infrastructure.databases.graph import get_graph_engine

    logger.info(f"[COGNEE] get_graph() dataset='{dataset}'")
    try:
        graph_engine = await get_graph_engine()
        nodes, edges = await graph_engine.get_graph_data()
        logger.info(f"[COGNEE] get_graph() returned {len(nodes)} nodes, {len(edges)} edges")
        return nodes, edges
    except Exception as e:
        logger.error(f"[COGNEE] get_graph() ERROR: {e}")
        return [], []


async def forget(dataset: str):
    """Remove a dataset from Cognee memory."""
    logger.info(f"[COGNEE] forget() dataset='{dataset}'")
    try:
        await cognee.forget(dataset=dataset)
        logger.info(f"[COGNEE] forget() OK")
    except Exception as e:
        logger.error(f"[COGNEE] forget() ERROR: {e}")
        raise