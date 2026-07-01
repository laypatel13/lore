import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse, ForgetRequest, MemoryStats, Source, GraphResponse, GraphNode, GraphEdge
from app.services import cognee_service, local_memory, synthesis
from datetime import datetime
from app.api.routes.ingest import jobs   # read live job stats

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

        # Fast Mode: local cosine similarity search, no LLM for retrieval,
        # one small Groq call to synthesize a clean answer from results.
        results = await local_memory.search(req.question, dataset=req.repo_id, top_k=6)
        if not results:
            return QueryResponse(answer="No relevant context found in memory.", sources=[], nodes_traversed=0)

        sources = [
            Source(type="chunk", id=f"local-{i}", text=r["text"][:200])
            for i, r in enumerate(results)
        ]
        raw_chunks = [r["text"] for r in results]

        # Ground truth: exact counts from the ingestion job, not guessed
        # from whatever chunks happened to match this query. Fixes the
        # "15 commits" hallucination — job.commits is the real number.
        ground_truth = None
        if job:
            ground_truth = {
                "commits": job.commits,
                "pull requests": job.prs,
                "issues": job.issues,
                "files in repo": job.files_discovered,
            }

        answer = await synthesis.synthesize_answer(req.question, raw_chunks, ground_truth=ground_truth)
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
            graph_mode=job.graph_mode,
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
        graph_mode=False,
    )


@router.get("/graph/{repo_id}", response_model=GraphResponse)
async def get_graph(repo_id: str):
    """
    Return the real Cognee-extracted graph (nodes/edges) for Full Graph Mode
    repos. Fast Mode repos never ran cognify(), so this returns an empty
    graph with graph_mode=False — frontend should fall back to the
    stylized summary view in that case.
    """
    job = jobs.get(repo_id)
    graph_mode = job.graph_mode if job else False

    if not graph_mode:
        return GraphResponse(graph_mode=False, nodes=[], edges=[])

    try:
        raw_nodes, raw_edges = await cognee_service.get_graph(dataset=repo_id)

        nodes = [
            GraphNode(
                id=str(n[0]),
                label=(n[1].get("name") or n[1].get("type") or str(n[0])[:8]),
                type=n[1].get("type", "Entity"),
            )
            for n in raw_nodes
        ]
        edges = [
            GraphEdge(source=str(e[0]), target=str(e[1]), label=str(e[2]))
            for e in raw_edges
        ]
        return GraphResponse(graph_mode=True, nodes=nodes, edges=edges)
    except Exception as e:
        logger.exception(f"[CHAT] get_graph error: {e}")
        raise HTTPException(500, str(e))