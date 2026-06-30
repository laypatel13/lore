import os
import tempfile
import logging
import httpx
from core.config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

# All text-based source / config / doc extensions worth indexing
SUPPORTED_EXTENSIONS = {
    # Code
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs",
    ".cpp", ".c", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
    ".kt", ".scala", ".r", ".m", ".sh", ".bash", ".zsh", ".fish",
    ".lua", ".pl", ".ex", ".exs", ".clj", ".hs", ".elm", ".dart",
    ".vue", ".svelte",
    # Config / infra
    ".toml", ".yaml", ".yml", ".json", ".ini", ".cfg", ".env",
    ".dockerfile", ".tf", ".hcl",
    # Docs
    ".md", ".mdx", ".rst", ".txt", ".adoc",
    # Web
    ".html", ".css", ".scss", ".sass", ".less",
    # Data
    ".sql", ".graphql", ".proto",
}

# Directories to always skip
SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    ".tox", "dist", "build", "target", ".next", ".nuxt", ".output",
    ".cache", "coverage", ".nyc_output", "vendor", "third_party",
    "eggs", ".eggs", "site-packages", ".pytest_cache", ".mypy_cache",
    ".ruff_cache", "buck-out", ".gradle", ".idea", ".vscode",
}

# Max file size to ingest (100 KB) — avoids binary/generated blobs
MAX_FILE_BYTES = 100_000


def parse_repo_url(url: str) -> tuple[str, str]:
    parts = url.rstrip("/").split("/")
    return parts[-2], parts[-1]


async def fetch_repo_meta(owner: str, repo: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=HEADERS)
        d = r.json()
        return {
            "name": d.get("name"),
            "full_name": d.get("full_name"),
            "description": d.get("description") or "",
        }


async def fetch_repo_files(owner: str, repo: str) -> list[dict]:
    """
    Fetch all repository files via the GitHub Trees API (recursive, single call).
    Returns list of dicts: {path, content}.
    Skips binary blobs, oversized files, and ignored directories.
    """
    logger.info(f"[FILES] Fetching recursive tree for {owner}/{repo}")

    async with httpx.AsyncClient(timeout=60) as client:
        # Get default branch
        meta_r = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=HEADERS)
        default_branch = meta_r.json().get("default_branch", "main")
        logger.info(f"[FILES] Default branch: {default_branch}")

        # Recursive tree in one API call
        tree_r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{default_branch}",
            headers=HEADERS,
            params={"recursive": "1"},
        )
        tree_data = tree_r.json()

    if tree_r.status_code != 200:
        logger.error(f"[FILES] Tree API error {tree_r.status_code}: {tree_data}")
        return []

    all_items = tree_data.get("tree", [])
    blobs = [i for i in all_items if i["type"] == "blob"]
    logger.info(f"[FILES] Total blobs in tree: {len(blobs)}")

    discovered = 0
    skipped_dir = 0
    skipped_ext = 0
    skipped_size = 0
    parsed = 0
    file_docs = []

    async with httpx.AsyncClient(timeout=30) as client:
        for item in blobs:
            path: str = item["path"]
            size: int = item.get("size", 0)
            discovered += 1

            # Skip ignored directories
            parts = path.split("/")
            if any(part in SKIP_DIRS for part in parts[:-1]):
                skipped_dir += 1
                logger.debug(f"[FILES] SKIP (dir) {path}")
                continue

            # Skip unsupported extensions
            ext = os.path.splitext(path)[1].lower()
            # Extensionless files (Makefile, Dockerfile, etc.) — allow by name
            basename = os.path.basename(path)
            if ext not in SUPPORTED_EXTENSIONS and basename not in {
                "Makefile", "Dockerfile", "Procfile", "Jenkinsfile",
                "Brewfile", "Gemfile", "Rakefile", "Guardfile",
            }:
                skipped_ext += 1
                logger.debug(f"[FILES] SKIP (ext={ext!r}) {path}")
                continue

            # Skip oversized files
            if size > MAX_FILE_BYTES:
                skipped_size += 1
                logger.warning(f"[FILES] SKIP (size={size}B > {MAX_FILE_BYTES}B) {path}")
                continue

            # Fetch raw content
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{path}"
            try:
                r = await client.get(raw_url)
                if r.status_code != 200:
                    logger.warning(f"[FILES] SKIP (HTTP {r.status_code}) {path}")
                    continue
                # Skip binary content
                try:
                    content = r.text
                except Exception:
                    skipped_ext += 1
                    continue

                if not content.strip():
                    logger.debug(f"[FILES] SKIP (empty) {path}")
                    continue

                file_docs.append({"path": path, "content": content, "size": size})
                parsed += 1
                if parsed % 10 == 0:
                    logger.info(f"[FILES] Parsed {parsed} files so far...")

            except Exception as e:
                logger.error(f"[FILES] ERROR fetching {path}: {e}")

    logger.info(
        f"[FILES] Discovery complete — "
        f"discovered={discovered}, "
        f"skipped_dir={skipped_dir}, "
        f"skipped_ext={skipped_ext}, "
        f"skipped_size={skipped_size}, "
        f"parsed={parsed}"
    )
    return file_docs


async def fetch_commits(owner: str, repo: str, max: int = 500) -> list[dict]:
    results = []
    page = 1
    async with httpx.AsyncClient() as client:
        while len(results) < max:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/commits",
                headers=HEADERS,
                params={"per_page": 100, "page": page},
            )
            data = r.json()
            if r.status_code != 200 or not data:
                break
            for c in data:
                results.append({
                    "sha": c["sha"][:7],
                    "message": c["commit"]["message"],
                    "author": c["commit"]["author"]["name"],
                    "date": c["commit"]["author"]["date"],
                })
            if len(data) < 100:
                break
            page += 1
    logger.info(f"[COMMITS] Fetched {len(results)} commits")
    return results[:max]


async def fetch_pull_requests(owner: str, repo: str, max: int = 200) -> list[dict]:
    results = []
    page = 1
    async with httpx.AsyncClient() as client:
        while len(results) < max:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
                headers=HEADERS,
                params={"state": "all", "per_page": 100, "page": page},
            )
            data = r.json()
            if r.status_code != 200 or not data:
                break
            for pr in data:
                results.append({
                    "number": pr["number"],
                    "title": pr["title"],
                    "body": (pr.get("body") or "")[:500],
                    "author": pr["user"]["login"],
                    "state": pr["state"],
                    "merged_at": pr.get("merged_at"),
                })
            if len(data) < 100:
                break
            page += 1
    logger.info(f"[PRS] Fetched {len(results)} pull requests")
    return results[:max]


async def fetch_issues(owner: str, repo: str, max: int = 200) -> list[dict]:
    results = []
    page = 1
    async with httpx.AsyncClient() as client:
        while len(results) < max:
            r = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/issues",
                headers=HEADERS,
                params={"state": "all", "per_page": 100, "page": page},
            )
            data = r.json()
            if r.status_code != 200 or not data:
                break
            for issue in data:
                if "pull_request" in issue:
                    continue
                results.append({
                    "number": issue["number"],
                    "title": issue["title"],
                    "body": (issue.get("body") or "")[:500],
                    "author": issue["user"]["login"],
                    "state": issue["state"],
                    "labels": [l["name"] for l in issue.get("labels", [])],
                })
            if len(data) < 100:
                break
            page += 1
    logger.info(f"[ISSUES] Fetched {len(results)} issues")
    return results[:max]
