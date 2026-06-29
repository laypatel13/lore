import os
import cognee
from core.config import settings
from models.schemas import Source


async def setup():
    """Configure Cognee on startup using env vars."""
    # Cognee 1.2.2 reads these from env automatically
    # but we set them explicitly for clarity
    os.environ["LLM_API_KEY"] = settings.LLM_API_KEY
    os.environ["GROQ_API_KEY"] = settings.LLM_API_KEY
    os.environ["LLM_MODEL"] = "groq/llama-3.1-8b-instant"
    os.environ["LLM_ENDPOINT"] = "https://api.groq.com/openai/v1"
    os.environ["EMBEDDING_PROVIDER"] = "fastembed"
    os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-MiniLM-L6-v2"
    os.environ["EMBEDDING_DIMENSIONS"] = "384"
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"


async def remember(text: str, dataset: str):
    """
    Ingest text into Cognee knowledge graph.
    remember() = add() + cognify() + improve() in one call.
    """
    await cognee.remember(text, dataset_name=dataset)


async def recall(question: str, dataset: str) -> tuple[str, list[Source]]:
    """
    Query Cognee knowledge graph via recall().
    Auto-routes between semantic search and graph traversal.
    """
    results = await cognee.recall(
        query_text=question,
        datasets=[dataset],
    )

    if not results:
        return "No relevant context found in memory.", []

    sources = []
    answer_parts = []

    for r in results[:6]:
        text = getattr(r, "text", None) or str(r)
        answer_parts.append(text)
        sources.append(Source(
            type=getattr(r, "type", "document"),
            id=getattr(r, "id", "unknown"),
            text=text[:200],
        ))

    answer = "\n\n".join(answer_parts)
    return answer, sources


async def improve(dataset: str):
    """Enrich and re-weight the knowledge graph."""
    await cognee.improve()


async def forget(dataset: str):
    """Remove a dataset from Cognee memory."""
    await cognee.forget(dataset=dataset)
