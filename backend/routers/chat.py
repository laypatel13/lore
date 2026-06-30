import logging
from fastapi import APIRouter, HTTPException
from models.schemas import QueryRequest, QueryResponse, ForgetRequest, MemoryStats, Source
from services import cognee_service, local_memory
from datetime import datetime
from routers.ingest import jobs   # read live job stats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        job = jobs.get(req.repo_id)
        graph_mode = job.graph_mode if job else False

        if graph_mode:
            answer, sources = await cognee_service.recall(req.question, dataset=req.repo_id, graph_mode=True)
            return QueryResponse(answer=answer, sources=sources, nodes_traversed=len(sources))

        # Fast Mode: local cosine similarity search, no LLM, instant
        results = await local_memory.search(req.question, dataset=req.repo_id, top_k=6)
        if not results:
            return QueryResponse(answer="No relevant context found in memory.", sources=[], nodes_traversed=0)

        sources = [
            Source(type="chunk", id=f"local-{i}", text=r["text"][:200])
            for i, r in enumerate(results)
        ]
        answer = "\n\n".join(r["text"] for r in results)
        return QueryResponse(answer=answer, sources=sources, nodes_traversed=len(sources))
    except Exception as e:
        logger.exception(f"[CHAT] query error: {e}")
        raise HTTPException(500, str(e))


@router.post("/improve")
async def improve(repo_id: str):
    job = jobs.get(repo_id)
    graph_mode = job.graph_mode if job else False
    if not graph_mode:
        return {"status": "ok", "message": "Fast Mode uses local vector search — no graph to enrich. Switch to Full Graph Mode to use improve()."}
    try:
        await cognee_service.improve(dataset=repo_id, graph_mode=True)
        return {"status": "ok", "message": "Graph enriched via improve()"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.delete("/forget")
async def forget(req: ForgetRequest):
    try:
        job = jobs.get(req.repo_id)
        graph_mode = job.graph_mode if job else False
        if graph_mode:
            await cognee_service.forget(dataset=req.repo_id)
        else:
            await local_memory.delete_dataset(dataset=req.repo_id)
        return {"status": "ok", "message": f"Dataset {req.repo_id} removed from memory"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/memory/{repo_id}", response_model=MemoryStats)
async def memory_stats(repo_id: str):
    """
    Return real ingestion stats from the in-memory job store.
    """
    job = jobs.get(repo_id)
    if job:
        total_nodes = job.commits + job.prs + job.issues + job.files_discovered
        return MemoryStats(
            repo_id=repo_id,
            total_nodes=total_nodes,
            total_edges=max(0, total_nodes - 1),   # rough lower bound
            commits=job.commits,
            prs=job.prs,
            issues=job.issues,
            files=job.files_discovered,
            chunks=job.chunks,
            last_updated=datetime.utcnow().isoformat(),
        )
    # No job found — return zeros
    return MemoryStats(
        repo_id=repo_id,
        total_nodes=0,
        total_edges=0,
        commits=0,
        prs=0,
        issues=0,
        files=0,
        chunks=0,
        last_updated=datetime.utcnow().isoformat(),
    )
