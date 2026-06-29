# Lore — Your codebase remembers. Finally.

> The AI that knows *why* your code exists — not just what it does.

Built for **WeMakeDevs Hangover Part AI Hackathon** · Powered by [Cognee](https://cognee.ai)

---

## Structure

```
lore/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/config.py           # Settings & env vars
│   ├── models/schemas.py        # Pydantic models
│   ├── routers/
│   │   ├── ingest.py            # POST /ingest
│   │   └── chat.py              # POST /chat/query, /improve, /forget
│   └── services/
│       ├── github.py            # GitHub API — commits, PRs, issues
│       ├── cognee_service.py    # remember() recall() improve() forget()
│       └── processor.py        # Format raw data for Cognee ingestion
│
└── frontend/
    └── public/
        ├── index.html           # Landing page
        ├── analyze.html         # Repo ingestion page
        ├── chat.html            # Interrogation room
        └── memory.html          # Knowledge graph view
```

---

## Running Locally

### ⚠️ Python version
Cognee requires **Python 3.10, 3.11, or 3.12**.
Check yours: `python3 --version`
If you're on 3.13+, install 3.11 via pyenv:
```bash
pyenv install 3.11
pyenv local 3.11
```

### 1. Setup backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set your env vars
```bash
cp .env.example .env
# Fill in:
# GITHUB_TOKEN   → github.com/settings/tokens (classic, repo scope)
# OPENAI_API_KEY → platform.openai.com
# COGNEE_API_KEY → app.cognee.ai (use code COGNEE-35 for free credit)
```

### 3. Run the backend
```bash
uvicorn main:app --reload
# API live at   http://localhost:8000
# Swagger docs  http://localhost:8000/docs
```

### 4. Open the frontend
Open `frontend/public/index.html` with VS Code Live Server.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ingest` | Start ingesting a GitHub repo |
| GET | `/ingest/{repo_id}/status` | Poll ingestion progress |
| POST | `/chat/query` | Ask a question about the repo |
| POST | `/chat/improve` | Run `improve()` on the graph |
| DELETE | `/chat/forget` | Remove dataset from memory |
| GET | `/chat/memory/{repo_id}` | Memory stats |
| GET | `/health` | Health check |

---

## Cognee Memory Lifecycle

| Operation | Where used |
|-----------|------------|
| `remember()` | Ingesting commits, PRs, issues → Cognee graph |
| `recall()` | Every chat query — auto-routed search |
| `improve()` | Post-ingestion enrichment + on new commits |
| `forget()` | Memory page — prune deprecated datasets |

---

Built by Lay Patel · WeMakeDevs Hackathon 2026 🗿
