"""
Answer synthesis: takes raw retrieved chunks (from local_memory.search()
or Cognee recall()) and asks Groq once to write a clean, short answer.

This is ONE call per user question — not per chunk — so it's a completely
different risk profile than cognify() (which was one call per chunk).
Same pattern as Clutch's insights_service.py weekly-summary call.
"""
import logging
import httpx
from core.config import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


async def synthesize_answer(question: str, chunks: list[str]) -> str:
    """
    Ask Groq to write a short, direct answer to `question` using only the
    provided `chunks` as context. Falls back to a raw-chunk excerpt if the
    call fails for any reason (rate limit, network, etc) so chat never
    breaks — it just degrades to the old raw-dump behavior.
    """
    if not chunks:
        return "No relevant context found in memory."

    context = "\n\n---\n\n".join(chunks[:6])
    # Keep prompt small — cap context length defensively
    if len(context) > 6000:
        context = context[:6000]

    prompt = f"""You are a codebase assistant answering questions about a Git repository using retrieved context chunks below.

Context:
{context}

Question: {question}

Write a short, direct, helpful answer in 2-4 sentences using only the context above. If the context doesn't fully answer the question, say what you can determine and note what's missing. Do not mention "chunks", "context", or "sources" — just answer naturally like a knowledgeable teammate."""

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 300,
                },
            )
            r.raise_for_status()
            data = r.json()
            answer = data["choices"][0]["message"]["content"].strip()
            logger.info(f"[SYNTHESIS] Groq answer generated ({len(answer)} chars)")
            return answer

    except Exception as e:
        logger.error(f"[SYNTHESIS] Groq call failed, falling back to raw chunks: {e}")
        # Graceful degradation — never break chat, just show raw context
        return "\n\n".join(chunks[:3])
