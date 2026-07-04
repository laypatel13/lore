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
DEFAULT_LLM_PROVIDER = "groq"  # deployed-safe default; "ollama" only works when the backend itself has Ollama running

# Tracks whether we've already tried connecting to Cognee Cloud this
# process, and whether it succeeded. Module-level so we only attempt the
# connection once per process instead of once per request.
_cloud_status = {"attempted": False, "connected": False}


async def _maybe_connect_cloud() -> bool:
    """
    Optional, fully additive Cognee Cloud connection via cognee.serve().

    This is a no-op unless BOTH COGNEE_CLOUD_URL and COGNEE_API_KEY are
    set. On the current Render deployment neither is set, so calling this
    changes nothing about the existing self-hosted pipeline — it returns
    False immediately and every downstream function behaves exactly as it
    does today.

    IMPORTANT: cognee.serve() can succeed at merely creating a remote
    client even when the instance is unreachable (we saw this in testing
    — it logged "Connected" and then every real add() call failed with a
    connection error). Once a remote client exists, Cognee routes ALL
    subsequent add()/cognify()/etc. calls to it unconditionally — there's
    no automatic per-call fallback. So we don't trust serve() alone: we
    immediately run one real, cheap operation to confirm the remote side
    actually works. If that fails, we explicitly disconnect and revert to
    the self-hosted pipeline before any real ingestion touches it.

    Tried once per process, not per-request, since cognee.serve() opens a
    persistent connection rather than something you'd redo per call.
    """
    if _cloud_status["attempted"]:
        return _cloud_status["connected"]
    _cloud_status["attempted"] = True

    if not settings.COGNEE_CLOUD_URL or not settings.COGNEE_API_KEY:
        logger.info("[COGNEE] Cloud not configured (COGNEE_CLOUD_URL/COGNEE_API_KEY unset) — using self-hosted pipeline")
        return False

    try:
        await cognee.serve(url=settings.COGNEE_CLOUD_URL, api_key=settings.COGNEE_API_KEY)
        logger.info("[COGNEE] cognee.serve() accepted — verifying with a real call before trusting it...")

        # Real verification, not just "did serve() return without raising".
        # 20s timeout so an unreachable host fails fast instead of hanging
        # the whole ingest request.
        import asyncio
        await asyncio.wait_for(
            cognee.remember("Lore cloud connectivity check", dataset_name="_lore_cloud_healthcheck"),
            timeout=20,
        )

        _cloud_status["connected"] = True
        logger.info("[COGNEE] Verified — Cognee Cloud is live at %s", settings.COGNEE_CLOUD_URL)
        return True

    except Exception as e:
        _cloud_status["connected"] = False
        logger.warning(
            "[COGNEE] Cloud connection failed verification (%s) — "
            "disconnecting and falling back to the self-hosted pipeline "
            "for the rest of this process. This is non-fatal: ingestion "
            "and chat continue exactly as before.", e
        )
        try:
            if hasattr(cognee, "disconnect"):
                await cognee.disconnect()
                logger.info("[COGNEE] Disconnected remote client — back on the self-hosted pipeline")
        except Exception as disconnect_error:
            logger.warning("[COGNEE] disconnect() itself failed (%s) — proceeding anyway; "
                            "self-hosted env vars set later in setup() take precedence regardless.", disconnect_error)
        return False
        return False


def cloud_status() -> dict:
    """Small introspection helper — e.g. to surface in a health check."""
    return dict(_cloud_status)


def _bust_cognee_config_cache():
    """
    CRITICAL: Cognee's own get_llm_config() and get_embedding_config() are
    each decorated with a bare @lru_cache (no arguments) — meaning each one
    reads os.environ exactly ONCE per process, the very first time anything
    calls it, and returns that same frozen object forever afterward.

    This means mutating os.environ in setup() below is NOT enough on its
    own: if Cognee's config was already read once earlier in this process
    (e.g. at app startup, or from a leftover LLM_PROVIDER=ollama in .env
    before multi-provider support existed), every subsequent setup() call
    with a different provider was silently a no-op — the actual LLM calls
    kept going to whatever was cached first, regardless of what the logs
    claimed. This was caught by noticing cognify() logs showing
    OllamaAPIAdapter/llama3.1:8b even after setup() logged "provider=gemini".

    Calling .cache_clear() forces Cognee to reconstruct both configs fresh
    from the CURRENT os.environ on next access, actually applying whatever
    setup() just set.
    """
    try:
        from cognee.infrastructure.llm.config import get_llm_config
        get_llm_config.cache_clear()
    except Exception as e:
        logger.warning(f"[COGNEE] could not clear LLM config cache: {e}")
    try:
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        get_embedding_config.cache_clear()
    except Exception as e:
        logger.warning(f"[COGNEE] could not clear embedding config cache: {e}")


def _configure_embeddings():
    """
    Embeddings always go through fastembed: local, in-process, ONNX-based,
    no network call and no rate limit per chunk. This is the same engine
    Fast Mode already uses, so it needs no extra API key and works
    identically on a laptop or on Render. Routing embeddings through
    Ollama/Groq/Gemini instead was the main reason Full Graph Mode kept
    timing out or hitting rate limits — that was N calls per chunk before
    cognify() even started.
    """
    os.environ["EMBEDDING_PROVIDER"] = "fastembed"
    os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-MiniLM-L6-v2"
    os.environ["EMBEDDING_DIMENSIONS"] = "384"
    os.environ.pop("EMBEDDING_ENDPOINT", None)
    os.environ.pop("HUGGINGFACE_TOKENIZER", None)


async def setup(provider: str = DEFAULT_LLM_PROVIDER):
    """
    Configure Cognee's LLM + embedding providers for this process.
    Called per-ingest (not just at startup) so `provider` can change
    per request based on what the frontend sent.

    provider="groq"   -> cloud, reachable from any deployment, uses the
                          existing GROQ_API_KEY. Rate-limited on the free
                          tier but works everywhere, including Render.
                          IMPORTANT: Cognee's own LLMProvider enum has no
                          native "groq" member (only openai, ollama,
                          anthropic, custom, gemini, mistral, azure,
                          bedrock, llama_cpp) — this was silently broken
                          the entire time, masked by the config-cache bug
                          (see _bust_cognee_config_cache above) which
                          meant real calls never actually reached the
                          provider-validation line until that was fixed.
                          Routed through LLMProvider.CUSTOM instead, which
                          Cognee builds specifically for any OpenAI-
                          compatible endpoint — Groq's API is exactly
                          that, at https://api.groq.com/openai/v1.
    provider="gemini"  -> cloud, uses GOOGLE_API_KEY (already in Settings,
                          previously unused). More generous free-tier
                          quota than Groq — best default for a deployed
                          Full Graph Mode run.
    provider="ollama"  -> local only. Only works if Ollama is actually
                          running on the same machine as this backend
                          process (i.e. local dev, not Render/Vercel).

    Also attempts an optional Cognee Cloud connection first (see
    _maybe_connect_cloud() above) — this is a no-op unless you've set
    COGNEE_CLOUD_URL/COGNEE_API_KEY, and everything below runs identically
    whether that succeeds, fails, or is skipped entirely.
    """
    await _maybe_connect_cloud()
    _configure_embeddings()

    if provider == "ollama":
        os.environ["LLM_PROVIDER"] = "ollama"
        os.environ["LLM_MODEL"] = "llama3.1:8b"
        os.environ["LLM_ENDPOINT"] = os.environ.get("OLLAMA_ENDPOINT", "http://localhost:11434/v1")
        os.environ["LLM_API_KEY"] = "ollama"  # dummy value, Cognee requires non-empty
        logger.info("[COGNEE] LLM provider: ollama (local-only, %s)", os.environ["LLM_ENDPOINT"])

    elif provider == "gemini":
        os.environ["LLM_PROVIDER"] = "gemini"
        os.environ["LLM_MODEL"] = "gemini/gemini-2.0-flash"
        os.environ["LLM_API_KEY"] = settings.GOOGLE_API_KEY
        os.environ.pop("LLM_ENDPOINT", None)
        logger.info("[COGNEE] LLM provider: gemini (gemini-2.0-flash)")

    else:  # groq (default) — routed through CUSTOM, see docstring above
        os.environ["LLM_PROVIDER"] = "custom"
        # litellm needs a provider-prefixed model name to know HOW to route
        # a custom-base-URL request — passing the endpoint alone isn't
        # enough; it still needs the prefix hint, same as any other
        # OpenAI-compatible custom endpoint would.
        os.environ["LLM_MODEL"] = "openai/llama-3.3-70b-versatile"
        os.environ["LLM_ENDPOINT"] = "https://api.groq.com/openai/v1"
        os.environ["LLM_API_KEY"] = settings.GROQ_API_KEY
        logger.info("[COGNEE] LLM provider: groq via custom endpoint (llama-3.3-70b-versatile)")

    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"
    _bust_cognee_config_cache()
    logger.info("[COGNEE] Setup complete (provider=%s, embeddings=fastembed)", provider)


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


def _field(result, key: str, default=None):
    """
    cognee.recall() returns different shapes depending on query_type:
    CHUNKS results are objects (attribute access, e.g. r.text), but
    GRAPH_COMPLETION results are plain dicts. getattr(dict, "text", None)
    silently returns None on a dict — it does NOT look up dict keys — so
    without this check the code fell through to str(r), dumping the
    entire raw dict (kind/search_type/score/dataset_id/raw/structured/...)
    into the chat as if it were the answer. This handles both shapes.
    """
    if isinstance(result, dict):
        return result.get(key, default)
    return getattr(result, key, default)


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
        # GRAPH_COMPLETION dicts hold the clean synthesized answer under
        # "text" (occasionally nested one level under "raw" -> "value" —
        # fall back to that before ever resorting to str(r)).
        text = (
            _field(r, "text")
            or _field(_field(r, "raw", {}) or {}, "value")
            or str(r)
        )
        answer_parts.append(text)
        sources.append(Source(
            type=_field(r, "type") or _field(r, "kind", "document"),
            id=str(_field(r, "id") or _field(r, "dataset_id", "unknown")),
            text=text[:200],
        ))

    logger.info(f"[COGNEE] recall() returned {len(results)} results, using top {len(sources)}")
    answer = "\n\n".join(dict.fromkeys(answer_parts))  # de-dupe identical parts, preserve order
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
    Retrieve the raw Cognee graph (nodes + edges) for visualization, scoped
    to exactly one dataset (repo).

    IMPORTANT FIX: get_graph_engine().get_graph_data() with no additional
    context returns whatever the graph engine's *current* database context
    happens to be — not "the graph for this dataset". In testing, ingesting
    two different repos in the same backend process and viewing each one's
    /memory page returned the IDENTICAL node/edge count for both — the
    second repo's page was silently showing the first repo's graph. This
    matches Cognee's own visualize_graph() (cognee/api/v1/visualize/
    visualize.py), which never calls the graph engine directly either — it
    first resolves the dataset via get_authorized_existing_datasets(), then
    wraps the actual fetch in set_database_global_context_variables(dataset.id,
    dataset.owner_id), which points the engine at that dataset's own
    database before reading from it. We do the same here instead of the
    bare get_graph_engine().get_graph_data() call this used to make.
    """
    from cognee.infrastructure.databases.graph import get_graph_engine
    from cognee.modules.data.methods import get_authorized_existing_datasets
    from cognee.modules.users.methods import get_default_user
    from cognee.context_global_variables import set_database_global_context_variables

    logger.info(f"[COGNEE] get_graph() dataset='{dataset}'")
    try:
        user = await get_default_user()
        resolved = await get_authorized_existing_datasets([dataset], "read", user)
        if not resolved:
            logger.warning(f"[COGNEE] get_graph() no dataset resolved for '{dataset}' — returning empty graph")
            return [], []

        async with set_database_global_context_variables(resolved[0].id, resolved[0].owner_id):
            graph_engine = await get_graph_engine()
            nodes, edges = await graph_engine.get_graph_data()

        logger.info(f"[COGNEE] get_graph() returned {len(nodes)} nodes, {len(edges)} edges (scoped to '{dataset}')")
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