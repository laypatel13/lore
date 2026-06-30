# Cognee Usage in Lore

This document maps every Cognee function used in this project to where it's
called from and why. `cognee` is only ever touched inside
`backend/app/services/cognee_service.py` — every router calls the wrapper
functions in that file, never the `cognee` package directly. That's the one
place to look if Cognee's API changes.

## Mode switch

Every Cognee wrapper function takes a `graph_mode: bool` argument:

| `graph_mode` | Behavior |
|---|---|
| `False` (default) | `add()` only. No LLM calls. Used for the reliable demo path — local `fastembed` vector storage handles retrieval instead (see `local_memory.py`, not Cognee). |
| `True` | Full pipeline — `add()` → `cognify()` → `improve()` on ingest, `GRAPH_COMPLETION` search on query. Real graph extraction, requires LLM quota. |

`graph_mode` is set per-ingestion via `IngestRequest.graph_mode` and stored
on the job (`IngestStatus.graph_mode`), so `/chat` endpoints look it up per
`repo_id` rather than taking it as a request param.

---

## `cognee.add()`

Wrapped by `cognee_service.remember_chunks()` and `cognee_service.remember()`.

**What it does**: stores a piece of text into a named Cognee dataset. This
is the only call that runs regardless of `graph_mode` — it's the raw
ingestion step.

**Called from**:

| Call site | Purpose |
|---|---|
| `app/api/routes/ingest.py` → `cognee_service.remember_chunks(file_chunks, dataset=rid, graph_mode=True)` | Ingests every chunked source file from the repo, one `add()` call per chunk |
| `app/api/routes/ingest.py` → `cognee_service.remember(metadata_text, dataset=rid, graph_mode=True)` | Ingests the single flattened text blob of commits/PRs/issues built by `processor.format_metadata()` |

> Note: both ingest call sites currently pass `graph_mode=True` explicitly,
> so on the live ingest path Cognee always runs the full pipeline below —
> the `graph_mode=False` fast path in `cognee_service.py` exists and is
> tested, but `local_memory.py` (a separate, non-Cognee local vector store)
> is what's actually used for the default fast demo flow today.

---

## `cognee.cognify()`

Wrapped inside `cognee_service.remember_chunks()` and `cognee_service.remember()`, run only `if graph_mode`.

**What it does**: runs LLM-based graph extraction over everything added so
far in the dataset — turns raw text into entities and relationships in the
knowledge graph. This is the expensive, rate-limited step.

**Called from**: not called directly by any router — it's triggered
internally, immediately after `add()`, inside the same `remember_chunks()` /
`remember()` calls listed above, whenever `graph_mode=True`.

---

## `cognee.recall()`

Wrapped by `cognee_service.recall()`.

**What it does**: queries a dataset and returns ranked results. The
`query_type` is forced explicitly:
- `SearchType.CHUNKS` when `graph_mode=False` — pure vector similarity, no
  LLM involved in retrieval.
- `SearchType.GRAPH_COMPLETION` when `graph_mode=True` — full graph
  traversal + LLM completion.

This explicit `query_type` matters: Cognee defaults to
`GRAPH_COMPLETION` regardless of how data was ingested, which would
silently fire an LLM call even against a dataset that was never
`cognify()`-ed.

**Called from**:

| Call site | Purpose |
|---|---|
| `app/api/routes/chat.py` → `POST /chat/query` | Only when the job's stored `graph_mode` is `True`. When `False`, `/chat/query` skips Cognee entirely and uses `local_memory.search()` + `synthesis.synthesize_answer()` instead. |

---

## `cognee.improve()`

Wrapped by `cognee_service.improve()`, no-ops immediately if `graph_mode=False`.

**What it does**: re-weights and enriches the existing knowledge graph
after new data has been added.

**Called from**:

| Call site | Purpose |
|---|---|
| `app/api/routes/ingest.py` (end of ingestion) | Runs once automatically after `cognify()`, whenever the job is `graph_mode=True` |
| `app/api/routes/chat.py` → `POST /chat/improve` | Manual trigger — returns a "Fast Mode has no graph to enrich" message instead of calling Cognee when the job is `graph_mode=False` |

---

## `cognee.forget()`

Wrapped by `cognee_service.forget()`.

**What it does**: deletes an entire dataset from Cognee's memory.

**Called from**:

| Call site | Purpose |
|---|---|
| `app/api/routes/chat.py` → `DELETE /chat/forget` | Only when the job's `graph_mode` is `True`; otherwise calls `local_memory.delete_dataset()` instead, since that's where the data actually lives in fast mode |

---

## Setup (not a memory op, but required first)

`cognee_service.setup()` configures Cognee's environment variables on
**every app startup**, not per-request:

```python
LLM_API_KEY, GROQ_API_KEY  -> settings.LLM_API_KEY
LLM_MODEL                  -> "groq/llama-3.1-8b-instant"
LLM_ENDPOINT               -> "https://api.groq.com/openai/v1"
EMBEDDING_PROVIDER         -> "fastembed"
EMBEDDING_MODEL            -> "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS       -> "384"
COGNEE_SKIP_CONNECTION_TEST -> "true"
```

**Called from**: `app/main.py`, inside the FastAPI `lifespan` context
manager, once on startup — before any request is served.

---

## Why the local switch exists

> **Note**: Full Graph Mode (`graph_mode=True`) is the "real" Cognee
> pipeline, but it depends entirely on the LLM provider's API holding up
> under load. On the free tier, Groq could not reliably comprehend/process
> the volume of `cognify()` calls a full repo ingestion generates —
> requests would get rate-limited or time out mid-ingestion, which made
> live demos unreliable. That's the reason `local_memory.py` and the
> `graph_mode=False` fast path exist: a local `fastembed` + cosine-similarity
> switch that bypasses the LLM entirely for ingestion and retrieval, so the
> app stays demoable regardless of free-tier API limits. Full Graph Mode is
> still wired up and used when LLM quota allows.

---

## Quick reference table

| Function | Wrapper | Runs when | Call sites |
|---|---|---|---|
| `cognee.add()` | `remember_chunks()`, `remember()` | always (both `graph_mode` values) | `ingest.py` (file chunks, metadata blob) |
| `cognee.cognify()` | inside `remember_chunks()`, `remember()` | `graph_mode=True` only | triggered internally after `add()` |
| `cognee.recall()` | `recall()` | `graph_mode=True` only (else `local_memory.search()`) | `chat.py` → `/chat/query` |
| `cognee.improve()` | `improve()` | `graph_mode=True` only | `ingest.py` (auto, end of run), `chat.py` → `/chat/improve` |
| `cognee.forget()` | `forget()` | `graph_mode=True` only (else `local_memory.delete_dataset()`) | `chat.py` → `/chat/forget` |
| (env setup) | `setup()` | once, on app startup | `main.py` lifespan |