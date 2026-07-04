# Setup — Groq, Gemini, Ollama

This is the practical setup guide for every LLM provider Lore supports in
Full Graph Mode, plus the one that's always required regardless of mode.
For *why* each of these exists and what Cognee function each one feeds,
see `COGNEE.md`. For the deploy-specific env var wiring (Render/Vercel),
see `DEPLOYMENT.md`. This doc is the one to read when you're asking
"which key do I need, and will this actually work where I'm running it."

---

## 0. The one thing you always need: `GROQ_API_KEY`

Even in the default mode (`graph_mode=False`, Fast Vector Mode — no
Cognee, no graph), Lore still makes **one small LLM call per question** to
turn raw vector-search chunks into a clean natural-language answer
(`app/services/synthesis.py`). That call always goes through Groq,
regardless of which provider you pick for Full Graph Mode extraction.

So: **`GROQ_API_KEY` is required in every configuration**, even if you
never touch Full Graph Mode. Get one free at
[console.groq.com](https://console.groq.com).

Everything below is about the *extra* provider choice that only matters
when `graph_mode=True`.

---

## 1. Quick reference — what works where

| Provider | Where it works | Needs | Free-tier ceiling |
|---|---|---|---|
| **Groq** | Local dev ✅ · Deployed (Render) ✅ | `GROQ_API_KEY` | Tight — 100k tokens/day (TPD) on the free tier. `cognify()` fires one call per chunk, so this empties fast on anything but a small repo. |
| **Gemini** | Local dev ✅ · Deployed (Render) ✅ | `GOOGLE_API_KEY` | More generous than Groq's free tier. Current recommended default for a deployed Full Graph Mode run. |
| **Ollama** | Local dev ✅ only · Deployed (Render) ❌ | Ollama running on **the same machine as the backend process** | No rate limit (it's your own hardware), but literally cannot exist on Render — see Section 4. |

If you only remember one thing from this doc: **the Ollama option in the
UI is real and works locally, but will silently fail on the deployed app
no matter what a visitor picks**, because there's no Ollama process
running on Render's box. This isn't a bug to fix later — it's a structural
limitation of local-only software, documented here so it's not surprising.

---

## 2. Groq setup

1. Create a free account at [console.groq.com](https://console.groq.com).
2. Generate an API key.
3. Set `GROQ_API_KEY` in:
   - Local: `backend/.env`
   - Deployed: Render → your service → Environment
4. That's it — no other config. `cognee_service.setup(provider="groq")`
   routes it through Cognee's `CUSTOM` provider type pointed at
   `https://api.groq.com/openai/v1`, using `llama-3.3-70b-versatile`.

**Known constraint**: Groq's free tier caps at 100,000 tokens/day (TPD),
not per-minute. Once you're near the cap, retries back off by *hours*, not
seconds — you'll see `RateLimitError` with a "try again in 1h..." message.
This is expected, not a Lore bug. If you hit it mid-demo, switch to Gemini
for the rest of the day.

---

## 3. Gemini setup

1. Get a free API key at
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Set `GOOGLE_API_KEY` in:
   - Local: `backend/.env`
   - Deployed: Render → your service → Environment
3. Select **Gemini** in the ingest form's provider dropdown (it's already
   the frontend's default) when `graph_mode=True`.
4. `cognee_service.setup(provider="gemini")` routes it to
   `gemini/gemini-2.0-flash` via `LLM_API_KEY=GOOGLE_API_KEY`.

**Recommended as the default Full Graph Mode provider on a deployed
backend** — its free tier gives more headroom than Groq's before you hit a
wall.

---

## 4. Ollama setup (local dev only — will NOT work deployed)

### Why it can't work on Render/Vercel

Ollama is a process that has to be **running on the same machine** the
backend calls into (`http://localhost:11434` by default). Render runs your
backend in its own isolated container — there is no Ollama process on that
box, and there's no way to "deploy" Ollama alongside a normal Render web
service in this project's current setup. Picking Ollama in the UI on the
*deployed* app will fail every single ingest, 100% of the time, regardless
of API keys or anything else being correct. This is why the frontend copy
explicitly labels Ollama "local dev only."

If you ever want Ollama to work against a deployed backend, you'd need to
run Ollama somewhere reachable over the network (a separate always-on
machine, a tunnel like ngrok, or a hosted "Ollama Cloud"-style endpoint)
and point `OLLAMA_ENDPOINT` at that public URL. **This project does not
currently implement or test that path** — treat it as a real project if
you want it, not a config flag away.

### Local setup steps

```bash
# 1. Install and start Ollama
brew install ollama          # or the installer from ollama.com
brew services start ollama   # or: ollama serve

# 2. Pull the models Lore expects
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# 3. (optional but recommended) sanity-check the pipeline in isolation
#    before running it through the real ingest flow
cd backend
pip install "cognee[ollama]"
python test_cognee_ollama.py
```

`test_cognee_ollama.py` runs `add() → cognify() → recall()` against a
tiny hardcoded text blob and prints pass/fail at each step — use it to
confirm Ollama itself is working *before* debugging the full ingest
pipeline, so you know which layer broke if something goes wrong.

### What `setup(provider="ollama")` actually configures

```python
LLM_PROVIDER   = "ollama"
LLM_MODEL      = "llama3.1:8b"
LLM_ENDPOINT   = os.environ.get("OLLAMA_ENDPOINT", "http://localhost:11434/v1")
LLM_API_KEY    = "ollama"   # dummy, Cognee just needs a non-empty string
```

Embeddings for the *real* ingest pipeline always use `fastembed`
regardless of provider (see Section 5) — only `test_cognee_ollama.py`'s
standalone script routes embeddings through Ollama too
(`nomic-embed-text`), because it's testing Ollama in isolation, not the
production code path.

**No API key needed** for Ollama itself — it's local. `LLM_API_KEY` is set
to a dummy `"ollama"` string purely because Cognee's config validation
requires the field to be non-empty.

---

## 5. Embeddings — always fastembed, regardless of provider

No matter which of the three providers above you pick, **embeddings never
go through them**. `_configure_embeddings()` in `cognee_service.py`
unconditionally sets:

```python
EMBEDDING_PROVIDER   = "fastembed"
EMBEDDING_MODEL      = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = "384"
```

`fastembed` runs locally, in-process, ONNX-based — no network call, no
rate limit, no API key, works identically on a laptop or on Render. This
was a deliberate fix: routing embeddings through Groq/Gemini/Ollama used
to mean N *extra* API calls per chunk before graph extraction even
started, which was a real contributor to hitting rate limits faster than
necessary. See `COGNEE.md` Section 4 for the full history of that bug.

---

## 6. Choosing a provider per request

`llm_provider` is sent per-ingest from the frontend
(`AnalyzePage.tsx`'s dropdown), defaults to `"gemini"` in the UI and
`"groq"` in the backend's own default
(`cognee_service.DEFAULT_LLM_PROVIDER`). It only matters when
`graph_mode=True` — Fast Vector Mode ignores it entirely.

**Practical recommendation for a live demo on the deployed app:**
Gemini first (bigger free-tier headroom), Groq as backup, Ollama never
(it will fail on Render regardless of what's selected).

---

## 7. Troubleshooting checklist

| Symptom | Likely cause |
|---|---|
| Full Graph Mode fails instantly on the deployed app, Ollama selected | Expected — see Section 4. Switch to Gemini or Groq. |
| `RateLimitError` mentioning "tokens per day (TPD)" | Groq free-tier daily quota hit. Wait it out or switch to Gemini for the rest of the day. |
| Fast Vector Mode itself fails (not just Full Graph Mode) | Check `GROQ_API_KEY` is set — it's required even outside Full Graph Mode, see Section 0. |
| Works locally, fails only when deployed | Almost always a missing env var on Render (`GROQ_API_KEY`/`GOOGLE_API_KEY`) or `VITE_API_URL` missing on Vercel — see `DEPLOYMENT.md`. |
| Backend restarted and now uses a provider you didn't pick | Startup (`main.py` lifespan) calls `cognee_service.setup()` with no args, defaulting to `"groq"` — this only sets *initial* env vars. Your actual ingest request calls `setup(provider=req.llm_provider)` again right before running, which overwrites it with whatever the frontend sent. If you're still seeing the wrong provider, confirm what was actually selected in the ingest form for that specific request. |
