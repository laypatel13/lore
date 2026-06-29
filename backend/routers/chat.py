from fastapi import APIRouter, HTTPException
from models.schemas import QueryRequest, QueryResponse, ForgetRequest, MemoryStats
from services import cognee_service
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        answer, sources = await cognee_service.recall(req.question, dataset=req.repo_id)
        return QueryResponse(answer=answer, sources=sources, nodes_traversed=len(sources))
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/improve")
async def improve(repo_id: str):
    try:
        await cognee_service.improve(dataset=repo_id)
        return {"status": "ok", "message": "Graph enriched via improve()"}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/forget")
async def forget(req: ForgetRequest):
    try:
        await cognee_service.forget(dataset=req.repo_id)
        return {"status": "ok", "message": f"Dataset {req.repo_id} removed from Cognee Cloud memory"}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/memory/{repo_id}", response_model=MemoryStats)
async def memory_stats(repo_id: str):
    return MemoryStats(
        repo_id=repo_id,
        total_nodes=0,
        total_edges=0,
        commits=0,
        prs=0,
        issues=0,
        last_updated=datetime.utcnow().isoformat(),
    )
