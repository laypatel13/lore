import logging
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)

client = Groq(api_key=settings.GROQ_API_KEY)

async def synthesize_answer(question: str, chunks: list[str], ground_truth: dict = None) -> str:
    context = "\n\n".join([f"--- CHUNK {i+1} ---\n{c[:700]}" for i, c in enumerate(chunks)])

    gt_text = ""
    if ground_truth:
        gt_text = f"""
Repository Facts (use these as absolute truth for any numbers):
- Commits: {ground_truth.get('commits', 0)}
- Pull Requests: {ground_truth.get('pull requests', 0)}
- Issues: {ground_truth.get('issues', 0)}
- Files: {ground_truth.get('files in repo', 0)}
"""

    prompt = f"""You are Lore, a straightforward codebase expert.

You have access to vector-searched chunks from the repo and exact repository stats.

{gt_text}

Context from repo:
{context}

Answer the question naturally and directly. Speak like an experienced developer who knows this repo well.
- Use the facts above for counts.
- If something is not in the data, say so honestly.
- Keep answers concise but informative.
- Avoid generic filler phrases.

Question: {question}

Answer:"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=700,
        )
        answer = response.choices[0].message.content.strip()
        return answer
    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        return "I couldn't generate a good answer right now. Try asking in a different way."