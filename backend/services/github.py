import httpx
from core.config import settings

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

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
    return results[:max]
