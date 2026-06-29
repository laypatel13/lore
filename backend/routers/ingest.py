from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.schemas import IngestRequest, IngestStatus
from services import github, processor, cognee_service
import hashlib

router = APIRouter(prefix="/ingest", tags=["ingest"])

# Simple in-memory job store
jobs: dict[str, IngestStatus] = {}

def repo_id(url: str) -> str:
    return hashlib.md5(url.strip().encode()).hexdigest()[:12]

async def run_ingestion(rid: str, req: IngestRequest):
    owner, repo = github.parse_repo_url(req.repo_url)
    jobs[rid].status = "ingesting"
    try:
        commits, prs, issues = [], [], []

        if req.include_commits:
            commits = await github.fetch_commits(owner, repo)
            jobs[rid].commits = len(commits)

        if req.include_prs:
            prs = await github.fetch_pull_requests(owner, repo)
            jobs[rid].prs = len(prs)

        if req.include_issues:
            issues = await github.fetch_issues(owner, repo)
            jobs[rid].issues = len(issues)

        text = processor.format_all(commits, prs, issues)

        # Core Cognee ops
        await cognee_service.remember(text, dataset=rid)
        await cognee_service.improve(dataset=rid)

        jobs[rid].status = "complete"
        jobs[rid].nodes = jobs[rid].commits + jobs[rid].prs + jobs[rid].issues
        jobs[rid].message = "Ingestion complete. Memory active on Cognee Cloud."

    except Exception as e:
        jobs[rid].status = "error"
        jobs[rid].message = str(e)

@router.post("/", response_model=IngestStatus)
async def start_ingestion(req: IngestRequest, bg: BackgroundTasks):
    rid = repo_id(req.repo_url)
    jobs[rid] = IngestStatus(repo_id=rid, status="pending", message="Queued")
    bg.add_task(run_ingestion, rid, req)
    return jobs[rid]

@router.get("/{repo_id}/status", response_model=IngestStatus)
async def get_status(repo_id: str):
    if repo_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[repo_id]
