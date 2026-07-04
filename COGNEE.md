# Cognee in Lore

What Cognee is used for, exactly which functions are called and from where,
the tradeoffs of how we're using it, and the real problems we ran into
building this — rate limits, Ollama, and the provider-routing bug.

`cognee` is only ever touched inside
`backend/app/services/cognee_service.py` — every router calls the wrapper
functions in that file, never the `cognee` package directly. That's the one
place to look if Cognee's API changes.

---

## 1. What Cognee actually does here

Lore has two parallel memory backends, chosen per ingestion via
`graph_mode: bool`:

| `graph_mode` | Backend | LLM involved? |
|---|---|---|
| `False` (default, "Fast Vector Mode") | `local_memory.py` — a hand-rolled `fastembed` + cosine-similarity store. **Not Cognee.** | No — pure embedding similarity search. |
| `True` ("Full Graph Mode") | **Cognee** — `add()` → `cognify()` → `improve()` on ingest, `GRAPH_COMPLETION` search on query | Yes — both for graph extraction and query-time completion. |

So Cognee is specifically the engine behind Full Graph Mode: it turns raw
ingested text into an actual entity-relationship knowledge graph, instead
of just a flat set of embeddings. Fast Mode exists as a separate,
non-Cognee code path precisely because Cognee's LLM-dependent pipeline
turned out to be too fragile for a reliable demo (see Section 4).

`graph_mode` is set once per ingestion via `IngestRequest.graph_mode`, and
stored on the job (`IngestStatus.graph_mode`) — so `/chat` endpoints look it
up per `repo_id` rather than taking it as a request parameter every time.

---

## 2. Every Cognee function used, and where

### `cognee.add()`

Wrapped by `cognee_service.remember_chunks()` and `cognee_service.remember()`.

Stores a piece of text into a named Cognee dataset. The raw ingestion step
— runs whenever `graph_mode=True`.

| Call site | Purpose |
|---|---|
| `app/api/routes/ingest.py` → `remember_chunks(file_chunks, dataset=rid, graph_mode=True)` | Ingests every chunked source file from the repo, one `add()` per chunk |
| `app/api/routes/ingest.py` → `remember(metadata_text, dataset=rid, graph_mode=True)` | Ingests the single flattened text blob of commits/PRs/issues from `processor.format_metadata()` |

### `cognee.cognify()`

Wrapped inside `remember_chunks()`/`remember()`, run only `if graph_mode`.

Runs LLM-based graph extraction over everything added so far — turns raw
text into entities and relationships. **This is the expensive, rate-limited
step** — one LLM call per chunk, which is the root of most problems
described in Section 4.

Not called directly by any router; triggered internally right after
`add()`, inside the same wrapper functions above.

### `cognee.recall()`

Wrapped by `cognee_service.recall()`. Queries a dataset and returns ranked
results, with `query_type` forced explicitly:

- `SearchType.CHUNKS` when `graph_mode=False` — pure vector similarity, no
  LLM call at retrieval time.
- `SearchType.GRAPH_COMPLETION` when `graph_mode=True` — full graph
  traversal + LLM completion.

Forcing `query_type` matters: Cognee defaults to `GRAPH_COMPLETION`
regardless of how data was ingested, which would silently fire an LLM call
even against a dataset that was never `cognify()`-ed.

| Call site | Purpose |
|---|---|
| `app/api/routes/chat.py` → `POST /chat/query` | Only when the job's stored `graph_mode` is `True`. When `False`, `/chat/query` skips Cognee entirely and uses `local_memory.search()` + `synthesis.synthesize_answer()` instead. |

### `cognee.improve()`

Wrapped by `cognee_service.improve()`, no-ops immediately if
`graph_mode=False`. Re-weights and enriches the existing graph after new
data has been added.

| Call site | Purpose |
|---|---|
| `app/api/routes/ingest.py` (end of ingestion) | Runs once automatically after `cognify()`, whenever `graph_mode=True` |
| `app/api/routes/chat.py` → `POST /chat/improve` | Manual trigger — returns "Fast Mode has no graph to enrich" instead of calling Cognee when `graph_mode=False` |

### `cognee.forget()`

Wrapped by `cognee_service.forget()`. Deletes an entire dataset.

| Call site | Purpose |
|---|---|
| `app/api/routes/chat.py` → `DELETE /chat/forget` | Only when `graph_mode=True`; otherwise calls `local_memory.delete_dataset()`, since that's where the data actually lives in Fast Mode |

### `setup()` — not a Cognee function, but required before any of the above

`cognee_service.setup(provider: str)` configures Cognee's environment
variables **per Full Graph Mode ingest request** (not just once at
startup — see Section 4 for why that changed).

Embeddings are always `fastembed` regardless of provider — local,
in-process, no network call, no rate limit per chunk:

```python
EMBEDDING_PROVIDER    -> "fastembed"
EMBEDDING_MODEL       -> "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS  -> "384"
```

The LLM extraction step (`cognify()`) is routed by `provider`:

| `provider` | `LLM_PROVIDER` | `LLM_MODEL` | Key | Works when deployed? |
|---|---|---|---|---|
| `"groq"` (default) | `groq` | `groq/llama-3.3-70b-versatile` | `GROQ_API_KEY` | ✅ |
| `"gemini"` | `gemini` | `gemini/gemini-2.0-flash` | `GOOGLE_API_KEY` | ✅ — recommended, more generous free tier |
| `"ollama"` | `ollama` | `llama3.1:8b` | n/a | ❌ local dev only, see Section 4 |

**Called from**: `ingest.py`, right before `remember_chunks()`/`remember()`,
whenever `graph_mode=True`. Also called once at `main.py` startup with the
default (`"groq"`) so `/chat/query`'s `GRAPH_COMPLETION` search has some
valid config even before any ingest happens in that process's lifetime.

---

## 3. Pros and cons of this setup, honestly

**Pros:**
- Full Graph Mode produces a real, browsable entity-relationship graph
  (`MemoryPage`) — genuinely more useful than flat similarity search for
  questions like "who touched this and why," which is the actual pitch of
  the product.
- The Fast/Full split means the product is never fully broken by an LLM
  provider having a bad day — Fast Mode has zero external dependencies
  besides GitHub's API.
- Provider choice (Gemini/Groq/Ollama) at the `cognify()` layer, with
  `fastembed` fixed for embeddings, isolates the flakiest part (rate
  limits, provider outages) to a single swappable seam.

**Cons / honest tradeoffs:**
- Full Graph Mode is meaningfully slower than Fast Mode by design — one LLM
  round-trip per chunk means ingestion time scales with repo size in a way
  Fast Mode doesn't.
- It depends on a third-party API's free-tier availability at demo time,
  which is not fully in our control no matter which provider is picked.
- Two independent memory backends (Cognee vs `local_memory.py`) means two
  code paths to keep behaviorally consistent — e.g. `forget()` has to
  remember to check `graph_mode` and call the *other* store's delete
  function, and it's easy to add a new feature to one path and forget the
  other (see `/chat/improve`'s explicit no-op branch, which exists
  specifically to avoid a confusing silent failure there).
- `setup()` being global-process env vars (not scoped per-request/async
  context) means concurrent Full Graph Mode ingests with *different*
  providers on the same running backend process could race — the last
  `setup()` call wins for any `cognify()`/`recall()` that hasn't started
  yet. This hasn't caused an observed bug (Render's default is a single
  worker process handling requests effectively sequentially for a
  hackathon-scale demo), but it's a real correctness gap if this were
  ever scaled to concurrent traffic.

---

## 4. Issues we actually hit building this

**Groq rate limits during `cognify()`.** The original build used Groq
exclusively for Full Graph Mode. `cognify()` fires one LLM call per chunk
via `asyncio.gather()`, all roughly concurrently — this blew through Groq's
free-tier rate limit almost immediately on anything but a tiny repo,
producing partial graphs or outright failures mid-ingestion. This is the
whole reason Fast Vector Mode (`local_memory.py`) exists at all: a
zero-LLM fallback so the app stays demoable regardless of what any single
provider's quota is doing that day.

**Ollama was more reliable locally, but not deployable.** To get around the
Groq rate limit, an earlier version routed *both* `cognify()` and
embeddings through a local Ollama instance — no rate limit, since it's your
own machine. This worked well in local dev, but Ollama running on
`localhost:11434` only exists on whichever machine is actually running it.
Once the backend was deployed to Render, there is no Ollama process on that
box, so Full Graph Mode was silently guaranteed to fail in production no
matter what a user picked in the UI. Ollama is also just slower per call
than a cloud API on modest local hardware, which compounded the "one call
per chunk" cost. Ollama is now explicitly scoped to local-dev-only in both
the code and the frontend copy, rather than presented as a deployable
option.

**The provider toggle was fully disconnected from the backend.** For a
while, the frontend had a working-looking Ollama/Groq toggle that did
*nothing* — `IngestRequest` never declared an `llm_provider` field, so
Pydantic silently dropped whatever the frontend sent, and
`cognee_service.setup()` unconditionally hardcoded one provider for the
whole process. The toggle only affected what text was displayed, not what
actually ran. Fixed by adding `llm_provider` to the schema, threading it
through to a `setup(provider)` call made right before each Full Graph Mode
ingest, and giving `fastembed` sole ownership of embeddings regardless of
which LLM provider is chosen for extraction — since embeddings were
originally also routed through whichever provider was hardcoded, and were
themselves a source of unnecessary per-chunk API calls.

**Current state**: Full Graph Mode works end-to-end on the deployed backend
via Gemini or Groq, and still works locally via Ollama. Rate limits are
still a real, expected constraint on the free tiers — not eliminated, just
no longer silently broken. See `DEPLOYMENT.md` for the operational
checklist this produced.

---

## 5. Quick reference

| Function | Wrapper | Runs when | Call sites |
|---|---|---|---|
| `cognee.add()` | `remember_chunks()`, `remember()` | always (both `graph_mode` values) | `ingest.py` (file chunks, metadata blob) |
| `cognee.cognify()` | inside `remember_chunks()`, `remember()` | `graph_mode=True` only | triggered internally after `add()` |
| `cognee.recall()` | `recall()` | `graph_mode=True` only (else `local_memory.search()`) | `chat.py` → `/chat/query` |
| `cognee.improve()` | `improve()` | `graph_mode=True` only | `ingest.py` (auto, end of run), `chat.py` → `/chat/improve` |
| `cognee.forget()` | `forget()` | `graph_mode=True` only (else `local_memory.delete_dataset()`) | `chat.py` → `/chat/forget` |
| (env setup) | `setup(provider)` | per Full Graph Mode ingest + once on app startup (`provider="groq"`) | `ingest.py` (per-request), `main.py` lifespan (default) |
