# Lore — Backend

FastAPI service that ingests a GitHub repo's commits/PRs/issues, builds a
queryable memory of it (vector or graph mode via Cognee), and answers
questions about *why* the code is the way it is.

## Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + lifespan setup
│   ├── core/
│   │   └── config.py              # Settings (env vars) via pydantic-settings
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   ├── api/
│   │   └── routes/
│   │       ├── ingest.py          # POST /ingest, GET /ingest/{id}
│   │       └── chat.py            # POST /chat — query a repo's memory
│   └── services/
│       ├── github_client.py       # GitHub REST API fetching (commits/PRs/issues)
│       ├── processor.py           # Flattens GitHub data into text chunks
│       ├── cognee_service.py      # Cognee setup + add/search wrapper
│       ├── local_memory.py        # Fast local fastembed + cosine-sim fallback
│       └── synthesis.py           # Groq LLM call that turns chunks into an answer
├── local_memory_store/            # Runtime-generated embeddings (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```

All imports are absolute from the `app` package root, e.g.
`from app.services import cognee_service`, `from app.core.config import settings`.

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in GROQ_API_KEY at minimum
uvicorn app.main:app --reload --port 8000
```

## Notes

- `graph_mode=False` (default) skips Cognee's LLM-based graph extraction
  and uses local `fastembed` vector embeddings instead — reliable, no rate
  limits, good for demos.
- `graph_mode=True` enables full Cognee graph extraction when LLM API
  quota allows.
- `local_memory_store/` defaults to `backend/local_memory_store/` resolved
  relative to the source file, so it works the same whether you run
  uvicorn from `backend/` or from the repo root.
