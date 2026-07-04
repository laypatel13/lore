# Deploying Lore

Lore is two separate deployments: **backend on Render**, **frontend on
Vercel**. They don't know about each other automatically — you have to wire
them together with env vars, in a specific order. This doc exists because
we've hit the same class of bug twice already (works locally, silently
breaks once deployed) from skipping this wiring.

---

## 1. Deploy the backend first (Render)

You need the backend's live URL before you can configure the frontend, so
this has to happen first.

**Service type**: Web Service, Python.

**Build command**:
```
pip install -r backend/requirements.txt
```

**Start command**:
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
```

**Environment variables** (Render dashboard → your service → Environment):

| Variable | Required? | Notes |
|---|---|---|
| `GROQ_API_KEY` | **Yes** | Used for every chat answer synthesis call, and is the default Full Graph Mode provider. Get one at [console.groq.com](https://console.groq.com). |
| `GOOGLE_API_KEY` | Only if you want the Gemini provider option in Full Graph Mode | Free tier at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Recommended over Groq for Full Graph Mode on a deployed backend — more generous rate limit. |
| `GITHUB_TOKEN` | No, but recommended | Raises GitHub API rate limits for ingestion. Without it you'll hit GitHub's unauthenticated rate limit fast on larger repos. |
| `COGNEE_API_KEY` | No | Only relevant if you're using Cognee's hosted service instead of the local pipeline this project uses by default. |
| `APP_ENV` | No | Defaults to `development`; set to `production` if you branch on it later. |

**Do NOT set** `OLLAMA_ENDPOINT` on Render — Ollama only works if it's
running on the same machine as the backend process, which is never true on
Render. Leave the `"ollama"` provider option for local dev only.

Once deployed, copy the live URL, e.g. `https://lore-backend.onrender.com`.
You'll need it in step 2.

### CORS — the part that's easy to forget

`backend/app/core/config.py` hardcodes `CORS_ORIGINS` as a Python list — it
is **not** read from an environment variable:

```python
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://lore-psi-inky.vercel.app",
]
```

If you deploy the frontend to a *different* Vercel URL than the one already
in this list, requests from your frontend will be silently blocked by CORS
— you'll see failed requests in the browser console with no obvious backend
error. **You have to add your frontend's URL to this list in code and
redeploy the backend.** This is a known rough edge (see "Known Issues"
below) — a cleaner version would read this from an env var instead.

---

## 2. Deploy the frontend (Vercel)

**Framework preset**: Vite (TanStack Start).

**Root directory**: `frontend`

**Build command**: `npm run build` (Vercel usually auto-detects this)

**Environment variables** (Vercel dashboard → Project → Settings →
Environment Variables):

| Variable | Required? | Value |
|---|---|---|
| `VITE_API_URL` | **Yes** | Your Render backend URL from step 1, e.g. `https://lore-backend.onrender.com` |

This is the single most common way this app breaks post-deploy: if
`VITE_API_URL` isn't set, `src/api/client.ts` falls back to
`http://localhost:8000`, which doesn't exist in a visitor's browser. Every
ingest/chat request will fail, and there's no error message pointing at the
actual cause — it just looks like the app is broken.

**Set the env var for all three Vercel environments** (Production, Preview,
Development) if you want preview deployments to work too, not just the
main production URL.

After setting `VITE_API_URL`, trigger a redeploy — Vite bakes env vars into
the build at build time, so just adding the variable doesn't retroactively
fix an already-built deployment.

---

## 3. Verify end-to-end

1. Open the deployed frontend URL.
2. Go to Analyze, paste a small public repo, leave Full Graph Mode off, hit
   Ingest. If this fails, it's almost always `VITE_API_URL` (frontend can't
   reach backend) or CORS (backend is rejecting the frontend's origin).
3. Turn on Full Graph Mode, pick Gemini or Groq, ingest again. If this
   times out or errors specifically here (but Fast Mode worked), check that
   the corresponding API key (`GOOGLE_API_KEY` / `GROQ_API_KEY`) is actually
   set on Render — a missing key fails inside Cognee's `cognify()` call,
   not at the HTTP layer, so it can look like a generic 500.

---

## Known issues / things to be upfront about

These aren't secrets — they're real constraints worth knowing before you
demo this or hand it to someone else:

- **CORS_ORIGINS is hardcoded, not env-driven.** Adding a new frontend
  domain means editing `config.py` and redeploying the backend, not just
  changing a dashboard setting. See above.
- **Full Graph Mode can be slow and can hit rate limits.** Both Groq and
  Gemini's free tiers cap requests per minute. Full Graph Mode sends one
  LLM call per chunk of the repo, so a bigger repo means more calls
  stacking against that limit. Cognee retries with backoff automatically,
  which avoids a hard failure, but it does mean a large repo can take
  several minutes and visibly pause/resume. This is expected behavior —
  Fast Vector Mode exists specifically as the instant, rate-limit-free
  alternative for demos.
- **Ollama is local-dev-only by design, not a temporary limitation.**
  There's no code path that makes a deployed backend reach an Ollama
  instance unless you separately expose one (e.g. a tunnel, or a hosted
  Ollama Cloud endpoint) and point `OLLAMA_ENDPOINT` at it — which this
  project doesn't currently implement or test against.
- **No staging environment.** There's one Render service and one Vercel
  project; testing a risky change means testing against what's effectively
  production, or running both stacks locally first.
