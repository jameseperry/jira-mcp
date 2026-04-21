from __future__ import annotations


# --- ADF to plain text ---

def adf_to_text(adf: dict | None) -> str:
    if not adf or not adf.get("content"):
        return ""
    return "\n\n".join(_node_to_text(node) for node in adf["content"])


def _node_to_text(node: dict) -> str:
    t = node.get("type")
    if t == "paragraph":
        return _inline_to_text(node.get("content"))
    if t == "heading":
        level = (node.get("attrs") or {}).get("level", 1)
        return "#" * level + " " + _inline_to_text(node.get("content"))
    if t == "bulletList":
        return "\n".join("- " + _list_item_text(item) for item in (node.get("content") or []))
    if t == "orderedList":
        return "\n".join(
            f"{i + 1}. " + _list_item_text(item)
            for i, item in enumerate(node.get("content") or [])
        )
    if t == "codeBlock":
        lang = (node.get("attrs") or {}).get("language", "")
        return f"```{lang}\n{_inline_to_text(node.get('content'))}\n```"
    if t == "blockquote":
        return "\n".join("> " + _node_to_text(c) for c in (node.get("content") or []))
    if t == "rule":
        return "---"
    if t == "table":
        return _table_to_text(node)
    return _inline_to_text(node.get("content"))


def _inline_to_text(content: list | None) -> str:
    if not content:
        return ""
    parts = []
    for c in content:
        t = c.get("type")
        if t == "text":
            parts.append(c.get("text", ""))
        elif t == "hardBreak":
            parts.append("\n")
        elif t == "mention":
            attrs = c.get("attrs") or {}
            parts.append(f"@{attrs.get('text') or attrs.get('id', 'unknown')}")
        elif t == "emoji":
            parts.append((c.get("attrs") or {}).get("shortName", ""))
        elif t == "inlineCard":
            parts.append((c.get("attrs") or {}).get("url", ""))
        else:
            parts.append(c.get("text", ""))
    return "".join(parts)


def _list_item_text(item: dict) -> str:
    return "\n  ".join(_node_to_text(c) for c in (item.get("content") or []))


def _table_to_text(node: dict) -> str:
    rows = []
    for row in node.get("content") or []:
        cells = [
            " ".join(_node_to_text(c) for c in (cell.get("content") or []))
            for cell in (row.get("content") or [])
        ]
        rows.append(" | ".join(cells))
    return "\n".join(rows)


# --- Plain text to ADF ---

def text_to_adf(text: str) -> dict:
    return {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": line}] if line else [],
            }
            for line in text.split("\n")
        ],
    }


# --- Structured issue extraction ---

def extract_issue(issue: dict) -> dict:
    """Extract a structured dict from a raw Jira issue response."""
    f = issue.get("fields") or {}
    result = {
        "key": issue["key"],
        "summary": f.get("summary"),
        "status": (f.get("status") or {}).get("name"),
        "type": (f.get("issuetype") or {}).get("name"),
    }
    if f.get("priority"):
        result["priority"] = f["priority"]["name"]
    if f.get("assignee"):
        a = f["assignee"]
        result["assignee"] = {"displayName": a["displayName"], "accountId": a["accountId"]}
    if f.get("reporter"):
        result["reporter"] = f["reporter"]["displayName"]
    if f.get("labels"):
        result["labels"] = f["labels"]
    if f.get("components"):
        result["components"] = [c["name"] for c in f["components"]]
    if f.get("fixVersions"):
        result["fixVersions"] = [v["name"] for v in f["fixVersions"]]
    if f.get("sprint"):
        result["sprint"] = f["sprint"]["name"]
    if f.get("parent"):
        result["parent"] = f["parent"]["key"]
    if f.get("duedate"):
        result["duedate"] = f["duedate"]
    if f.get("startDate"):
        result["startDate"] = f["startDate"]
    if f.get("created"):
        result["created"] = f["created"]
    if f.get("updated"):
        result["updated"] = f["updated"]
    if f.get("resolution"):
        result["resolution"] = f["resolution"]["name"]
    if f.get("description"):
        result["description"] = (
            f["description"] if isinstance(f["description"], str)
            else adf_to_text(f["description"])
        )
    return result


def extract_issue_summary(issue: dict) -> dict:
    """Extract a compact structured dict from a Jira issue."""
    f = issue.get("fields") or {}
    return {
        "key": issue["key"],
        "summary": f.get("summary"),
        "status": (f.get("status") or {}).get("name"),
        "type": (f.get("issuetype") or {}).get("name"),
        "assignee": (f.get("assignee") or {}).get("displayName"),
        "priority": (f.get("priority") or {}).get("name"),
    }
