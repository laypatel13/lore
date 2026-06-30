import logging

logger = logging.getLogger(__name__)

# Chunk size: characters. ~800 chars ≈ ~200 tokens — good for retrieval granularity.
CHUNK_SIZE = 800
CHUNK_OVERLAP = 80


def chunk_text(text: str, source_label: str) -> list[str]:
    """
    Split text into overlapping chunks with a source header on each chunk.
    Returns list of chunk strings.
    """
    if not text.strip():
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_body = text[start:end]
        chunks.append(f"[SOURCE: {source_label}]\n{chunk_body}")
        if end >= len(text):
            break
        start = end - CHUNK_OVERLAP  # overlap

    return chunks


def format_file_chunks(file_docs: list[dict]) -> list[str]:
    """
    Convert list of {path, content} dicts into indexed text chunks.
    Returns flat list of chunk strings.
    """
    all_chunks = []
    for doc in file_docs:
        path = doc["path"]
        content = doc["content"]
        chunks = chunk_text(content, source_label=f"FILE:{path}")
        all_chunks.extend(chunks)
        logger.debug(f"[CHUNK] {path} → {len(chunks)} chunks")

    logger.info(f"[CHUNK] Total file chunks generated: {len(all_chunks)}")
    return all_chunks


def format_commits(commits: list) -> str:
    lines = ["=== COMMIT HISTORY ==="]
    for c in commits:
        lines.append(
            f"[COMMIT {c['sha']}] by {c['author']} on {c['date'][:10]}: {c['message'].strip()}"
        )
    return "\n".join(lines)


def format_prs(prs: list) -> str:
    lines = ["\n=== PULL REQUESTS ==="]
    for pr in prs:
        merged = f"Merged: {pr['merged_at'][:10]}" if pr.get("merged_at") else f"State: {pr['state']}"
        lines.append(
            f"[PR #{pr['number']}] '{pr['title']}' by @{pr['author']}. {merged}. {pr['body']}"
        )
    return "\n".join(lines)


def format_issues(issues: list) -> str:
    lines = ["\n=== ISSUES ==="]
    for i in issues:
        labels = ", ".join(i["labels"]) if i["labels"] else "none"
        lines.append(
            f"[ISSUE #{i['number']}] '{i['title']}' by @{i['author']}. State: {i['state']}. Labels: {labels}. {i['body']}"
        )
    return "\n".join(lines)


def format_metadata(commits: list, prs: list, issues: list) -> str:
    """Format GitHub metadata (commits/PRs/issues) into a single text block."""
    parts = []
    if commits:
        parts.append(format_commits(commits))
    if prs:
        parts.append(format_prs(prs))
    if issues:
        parts.append(format_issues(issues))
    return "\n".join(parts)


def format_all(commits: list, prs: list, issues: list) -> str:
    """Legacy single-blob format — kept for backwards compatibility."""
    return format_metadata(commits, prs, issues)
