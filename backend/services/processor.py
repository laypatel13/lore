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

def format_all(commits: list, prs: list, issues: list) -> str:
    parts = []
    if commits: parts.append(format_commits(commits))
    if prs:     parts.append(format_prs(prs))
    if issues:  parts.append(format_issues(issues))
    return "\n".join(parts)
