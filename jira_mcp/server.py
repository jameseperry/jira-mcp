from __future__ import annotations

import re
from urllib.parse import quote

from fastmcp import FastMCP

from jira_mcp.jira_client import JiraClient
from jira_mcp.formatters import extract_issue, extract_issue_summary, text_to_adf

mcp = FastMCP("jira-mcp")
client = JiraClient()


# --- Projects ---


@mcp.tool()
async def jira_list_projects(
    instance: str | None = None,
    maxResults: int | None = None,
) -> list[dict]:
    """List all accessible Jira projects"""
    params = f"?maxResults={maxResults}" if maxResults else ""
    data = await client.instance_for(instance).get(f"/project/search{params}")
    return [
        {"key": p["key"], "name": p["name"], "type": p["projectTypeKey"]}
        for p in (data.get("values") or [])
    ]


# --- Search ---


@mcp.tool()
async def jira_search(
    jql: str,
    instance: str | None = None,
    maxResults: int | None = None,
    fields: list[str] | None = None,
) -> dict:
    """Search Jira issues using JQL (Jira Query Language)"""
    body = {
        "jql": jql,
        "maxResults": min(maxResults or 20, 100),
        "fields": fields if fields else ["summary", "status", "assignee", "issuetype", "priority"],
    }
    data = await client.instance_for(instance).post("/search/jql", body)
    issues = [extract_issue_summary(i) for i in (data.get("issues") or [])]
    return {"total": data.get("total", len(issues)), "issues": issues}


# --- Issues ---


@mcp.tool()
async def jira_get_issue(
    issueKey: str,
    instance: str | None = None,
) -> dict:
    """Get detailed information about a specific Jira issue"""
    issue = await client.instance_for(instance).get(f"/issue/{quote(issueKey)}")
    return extract_issue(issue)


@mcp.tool()
async def jira_create_issue(
    projectKey: str,
    issueType: str,
    summary: str,
    instance: str | None = None,
    description: str | None = None,
    assigneeId: str | None = None,
    priority: str | None = None,
    labels: list[str] | None = None,
    components: list[str] | None = None,
    parentKey: str | None = None,
    duedate: str | None = None,
    startDate: str | None = None,
) -> dict:
    """Create a new Jira issue"""
    jira = client.instance_for(instance)
    fields: dict = {
        "project": {"key": projectKey},
        "issuetype": {"name": issueType},
        "summary": summary,
    }
    if description:
        fields["description"] = text_to_adf(description)
    if assigneeId:
        fields["assignee"] = {"accountId": assigneeId}
    if priority:
        fields["priority"] = {"name": priority}
    if labels:
        fields["labels"] = labels
    if components:
        fields["components"] = [{"name": n} for n in components]
    if parentKey:
        fields["parent"] = {"key": parentKey}
    if duedate:
        fields["duedate"] = duedate
    if startDate:
        fields["startDate"] = startDate

    result = await jira.post("/issue", {"fields": fields})
    url = re.sub(r"/rest/api/3/issue/.*", f"/browse/{result['key']}", result.get("self", ""))
    return {"key": result["key"], "id": result["id"], "url": url}


@mcp.tool()
async def jira_update_issue(
    issueKey: str,
    instance: str | None = None,
    summary: str | None = None,
    description: str | None = None,
    assigneeId: str | None = None,
    priority: str | None = None,
    labels: list[str] | None = None,
    components: list[str] | None = None,
    duedate: str | None = None,
    startDate: str | None = None,
) -> dict:
    """Update fields on an existing Jira issue"""
    jira = client.instance_for(instance)
    fields: dict = {}
    if summary:
        fields["summary"] = summary
    if description:
        fields["description"] = text_to_adf(description)
    if assigneeId == "none":
        fields["assignee"] = None
    elif assigneeId:
        fields["assignee"] = {"accountId": assigneeId}
    if priority:
        fields["priority"] = {"name": priority}
    if labels:
        fields["labels"] = labels
    if components:
        fields["components"] = [{"name": n} for n in components]
    if duedate:
        fields["duedate"] = duedate
    if startDate:
        fields["startDate"] = startDate

    await jira.put(f"/issue/{quote(issueKey)}", {"fields": fields})
    return {"key": issueKey, "updated": True}


@mcp.tool()
async def jira_assign_issue(
    issueKey: str,
    accountId: str,
    instance: str | None = None,
) -> dict:
    """Assign a Jira issue to a user"""
    await client.instance_for(instance).put(
        f"/issue/{quote(issueKey)}/assignee",
        {"accountId": None if accountId == "none" else accountId},
    )
    return {"key": issueKey, "assignee": None if accountId == "none" else accountId}


# --- Comments ---


@mcp.tool()
async def jira_add_comment(
    issueKey: str,
    body: str,
    instance: str | None = None,
) -> dict:
    """Add a comment to a Jira issue"""
    result = await client.instance_for(instance).post(
        f"/issue/{quote(issueKey)}/comment",
        {"body": text_to_adf(body)},
    )
    return {"key": issueKey, "commentId": result["id"]}


# --- Transitions ---


@mcp.tool()
async def jira_get_transitions(
    issueKey: str,
    instance: str | None = None,
) -> dict:
    """Get available status transitions for an issue"""
    data = await client.instance_for(instance).get(f"/issue/{quote(issueKey)}/transitions")
    transitions = [
        {"id": t["id"], "name": t["name"], "to": (t.get("to") or {}).get("name")}
        for t in (data.get("transitions") or [])
    ]
    return {"key": issueKey, "transitions": transitions}


@mcp.tool()
async def jira_transition_issue(
    issueKey: str,
    transitionId: str,
    instance: str | None = None,
    comment: str | None = None,
) -> dict:
    """Transition a Jira issue to a new status"""
    body: dict = {"transition": {"id": transitionId}}
    if comment:
        body["update"] = {
            "comment": [
                {
                    "add": {
                        "body": text_to_adf(comment),
                    }
                }
            ]
        }
    await client.instance_for(instance).post(f"/issue/{quote(issueKey)}/transitions", body)
    return {"key": issueKey, "transitionId": transitionId}


# --- Boards & Sprints ---


@mcp.tool()
async def jira_list_boards(
    instance: str | None = None,
    projectKeyOrId: str | None = None,
    type: str | None = None,
    maxResults: int | None = None,
) -> list[dict]:
    """List Jira agile boards"""
    params = []
    if projectKeyOrId:
        params.append(f"projectKeyOrId={projectKeyOrId}")
    if type:
        params.append(f"type={type}")
    if maxResults:
        params.append(f"maxResults={maxResults}")
    qs = "?" + "&".join(params) if params else ""
    data = await client.instance_for(instance).agile_get(f"/board{qs}")
    return [
        {"id": b["id"], "name": b["name"], "type": b["type"]}
        for b in (data.get("values") or [])
    ]


@mcp.tool()
async def jira_list_sprints(
    boardId: int,
    instance: str | None = None,
    state: str | None = None,
) -> list[dict]:
    """List sprints for a board"""
    qs = f"?state={state}" if state else ""
    data = await client.instance_for(instance).agile_get(f"/board/{boardId}/sprint{qs}")
    sprints = []
    for s in data.get("values") or []:
        sprint: dict = {"id": s["id"], "name": s["name"], "state": s["state"]}
        if s.get("startDate"):
            sprint["startDate"] = s["startDate"]
        if s.get("endDate"):
            sprint["endDate"] = s["endDate"]
        if s.get("goal"):
            sprint["goal"] = s["goal"]
        sprints.append(sprint)
    return sprints


@mcp.tool()
async def jira_create_sprint(
    name: str,
    boardId: int,
    instance: str | None = None,
    startDate: str | None = None,
    endDate: str | None = None,
    goal: str | None = None,
) -> dict:
    """Create a new sprint"""
    body: dict = {"name": name, "originBoardId": boardId}
    if startDate:
        body["startDate"] = startDate
    if endDate:
        body["endDate"] = endDate
    if goal:
        body["goal"] = goal
    result = await client.instance_for(instance).agile_post("/sprint", body)
    return {"id": result["id"], "name": result["name"], "state": result.get("state")}


@mcp.tool()
async def jira_get_sprint_issues(
    sprintId: int,
    instance: str | None = None,
    maxResults: int | None = None,
) -> dict:
    """Get issues in a sprint"""
    params = ["fields=summary,status,assignee,issuetype,priority"]
    if maxResults:
        params.append(f"maxResults={maxResults}")
    qs = "?" + "&".join(params)
    data = await client.instance_for(instance).agile_get(f"/sprint/{sprintId}/issue{qs}")
    issues = [extract_issue_summary(i) for i in (data.get("issues") or [])]
    return {"total": data.get("total", len(issues)), "issues": issues}


@mcp.tool()
async def jira_move_issues_to_sprint(
    sprintId: int,
    issueKeys: list[str],
    instance: str | None = None,
) -> dict:
    """Move issues to a sprint"""
    await client.instance_for(instance).agile_post(
        f"/sprint/{sprintId}/issue",
        {"issues": issueKeys},
    )
    return {"sprintId": sprintId, "movedIssues": issueKeys}


# --- Links ---


@mcp.tool()
async def jira_get_link_types(
    instance: str | None = None,
) -> list[dict]:
    """Get available issue link types"""
    data = await client.instance_for(instance).get("/issueLinkType")
    return [
        {"name": t["name"], "inward": t["inward"], "outward": t["outward"]}
        for t in (data.get("issueLinkTypes") or [])
    ]


@mcp.tool()
async def jira_link_issues(
    linkType: str,
    inwardIssueKey: str,
    outwardIssueKey: str,
    instance: str | None = None,
) -> dict:
    """Create a link between two Jira issues"""
    await client.instance_for(instance).post("/issueLink", {
        "type": {"name": linkType},
        "inwardIssue": {"key": inwardIssueKey},
        "outwardIssue": {"key": outwardIssueKey},
    })
    return {"linkType": linkType, "inward": inwardIssueKey, "outward": outwardIssueKey}


def main():
    mcp.run()


if __name__ == "__main__":
    main()
