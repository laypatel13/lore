"""
Standalone sanity check: does Cognee + local Ollama actually complete
add() -> cognify() -> recall() on a tiny piece of text?

Run this BEFORE touching the real repo ingestion pipeline.
Prereqs:
  - ollama serve running (brew services start ollama)
  - ollama pull llama3.1:8b
  - ollama pull nomic-embed-text
  - pip install "cognee[ollama]"

Usage:
  cd backend
  source venv/bin/activate   # if using a venv
  python test_cognee_ollama.py
"""
import asyncio
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def configure_ollama():
    os.environ["LLM_PROVIDER"] = "ollama"
    os.environ["LLM_MODEL"] = "llama3.1:8b"
    os.environ["LLM_ENDPOINT"] = "http://localhost:11434/v1"
    os.environ["LLM_API_KEY"] = "ollama"
    os.environ["EMBEDDING_PROVIDER"] = "ollama"
    os.environ["EMBEDDING_MODEL"] = "nomic-embed-text"
    os.environ["EMBEDDING_ENDPOINT"] = "http://localhost:11434/api/embed"
    os.environ["EMBEDDING_DIMENSIONS"] = "768"
    os.environ["HUGGINGFACE_TOKENIZER"] = "nomic-ai/nomic-embed-text-v1.5"
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"


async def main():
    configure_ollama()
    import cognee
    from cognee.modules.search.types import SearchType

    dataset = "lore_ollama_test"
    test_text = (
        "Lore is a codebase memory tool. It ingests GitHub repositories "
        "into a knowledge graph using Cognee. The backend is built with "
        "FastAPI and the frontend uses React with Vite. The key "
        "architectural decision was a graph_mode toggle: False uses fast "
        "local vector embedding for a reliable live demo, while True "
        "enables full Cognee LLM-based graph extraction."
    )

    print("\n[1/4] Clearing any old test data...")
    try:
        await cognee.forget(dataset=dataset)
    except Exception as e:
        print(f"  (nothing to clear, or forget() failed harmlessly: {e})")

    print("\n[2/4] Running cognee.add()...")
    await cognee.add(test_text, dataset_name=dataset)
    print("  ✓ add() completed")

    print("\n[3/4] Running cognee.cognify() — this is the real test, may take 30-90s on M4...")
    await cognee.cognify(datasets=[dataset])
    print("  ✓ cognify() completed — graph extraction via Ollama worked!")

    print("\n[4/4] Running cognee.recall() with GRAPH_COMPLETION...")
    results = await cognee.recall(
        query_text="What is the graph_mode toggle used for?",
        datasets=[dataset],
        query_type=SearchType.GRAPH_COMPLETION,
    )

    if not results:
        print("  ✗ No results returned — cognify() may not have built a usable graph")
    else:
        print(f"  ✓ Got {len(results)} result(s):")
        for r in results[:3]:
            text = getattr(r, "text", None) or str(r)
            print(f"    - {text[:200]}")

    print("\n✅ ALL STEPS PASSED — Cognee + Ollama full graph pipeline works end-to-end.")


if __name__ == "__main__":
    asyncio.run(main())
