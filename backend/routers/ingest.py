import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.schemas import IngestRequest, IngestStatus
from services import github, processor, cognee_service, local_memory
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingest", tags=["ingest"])

# Simple in-memory job store
jobs: dict[str, IngestStatus] = {}


def repo_id(url: str) -> str:
    return hashlib.md5(url.strip().encode()).hexdigest()[:12]


async def run_ingestion(rid: str, req: IngestRequest):
    owner, repo = github.parse_repo_url(req.repo_url)
    jobs[rid].status = "ingesting"
    jobs[rid].graph_mode = req.graph_mode
    logger.info(f"[INGEST] Starting ingestion for {owner}/{repo} (rid={rid}, graph_mode={req.graph_mode})")

    try:
        commits, prs, issues = [], [], []

        # ── 1. Fetch GitHub metadata ───────────────────────────────────────
        if req.include_commits:
            commits = await github.fetch_commits(owner, repo)
            jobs[rid].commits = len(commits)
            logger.info(f"[INGEST] Commits fetched: {len(commits)}")

        if req.include_prs:
            prs = await github.fetch_pull_requests(owner, repo)
            jobs[rid].prs = len(prs)
            logger.info(f"[INGEST] PRs fetched: {len(prs)}")

        if req.include_issues:
            issues = await github.fetch_issues(owner, repo)
            jobs[rid].issues = len(issues)
            logger.info(f"[INGEST] Issues fetched: {len(issues)}")

        # ── 2. Fetch all repository source files ──────────────────────────
        logger.info(f"[INGEST] Fetching repository files...")
        file_docs = await github.fetch_repo_files(owner, repo)
        jobs[rid].files_discovered = len(file_docs)
        logger.info(f"[INGEST] Files fetched: {len(file_docs)}")

        # ── 3. Chunk file contents ─────────────────────────────────────────
        file_chunks = processor.format_file_chunks(file_docs)
        jobs[rid].chunks = len(file_chunks)
        logger.info(f"[INGEST] File chunks generated: {len(file_chunks)}")

        # ── 4. Store file chunks ────────────────────────────────────────────
        # Fast Mode: embed + store locally, zero LLM calls, instant, reliable.
        # Full Graph Mode: route through real Cognee add()+cognify() pipeline.
        if req.graph_mode:
            stored = await cognee_service.remember_chunks(file_chunks, dataset=rid, graph_mode=True)
        else:
            stored = await local_memory.store_chunks(file_chunks, dataset=rid)
        jobs[rid].docs_stored = stored
        logger.info(f"[INGEST] File chunks stored: {stored}")

        # ── 5. Ingest metadata blob ────────────────────────────────────────
        metadata_text = processor.format_metadata(commits, prs, issues)
        if metadata_text.strip():
            if req.graph_mode:
                await cognee_service.remember(metadata_text, dataset=rid, graph_mode=True)
            else:
                await local_memory.store_chunks([metadata_text], dataset=rid)
            logger.info(f"[INGEST] Metadata blob ingested")

        # ── 6. Improve graph (Full Graph Mode only) ─────────────────────────
        if req.graph_mode:
            await cognee_service.improve(dataset=rid, graph_mode=True)

        # ── 7. Mark complete ───────────────────────────────────────────────
        total_nodes = (
            jobs[rid].commits
            + jobs[rid].prs
            + jobs[rid].issues
            + jobs[rid].files_discovered
        )
        jobs[rid].status = "complete"
        jobs[rid].nodes = total_nodes
        mode_label = "Full Graph (Cognee LLM)" if req.graph_mode else "Fast Vector Mode"
        jobs[rid].message = (
            f"Ingestion complete [{mode_label}]. "
            f"Files: {len(file_docs)}, "
            f"Chunks: {len(file_chunks)}, "
            f"Stored: {stored}, "
            f"Commits: {len(commits)}, "
            f"PRs: {len(prs)}, "
            f"Issues: {len(issues)}"
        )
        logger.info(f"[INGEST] Complete: {jobs[rid].message}")

    except Exception as e:
        logger.exception(f"[INGEST] ERROR: {e}")
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
