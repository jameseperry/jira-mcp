# jira-mcp

A [Model Context Protocol](https://modelcontextprotocol.io/) server for Jira Cloud built with [FastMCP](https://github.com/jlowin/fastmcp). Gives AI assistants (Claude Code, etc.) full read/write access to Jira issues, sprints, boards, and more.

## Features

- **Issue management** — search (JQL), get, create, update, assign
- **Comments** — add comments (plain text, auto-converted to ADF)
- **Workflows** — view transitions, move issues through statuses
- **Sprints & boards** — list boards, manage sprints, move issues
- **Issue links** — view link types, create links between issues
- **Projects** — list accessible projects
- **Multi-instance** — work across multiple Jira Cloud sites via named instances
- **Structured output** — all tools return JSON, not formatted text

## Installation

### pipx (recommended)

```bash
pipx install git+https://github.com/jameseperry/jira-mcp.git
```

This installs `jira-mcp` as a standalone command.

### pip

```bash
pip install git+https://github.com/jameseperry/jira-mcp.git
```

### From source

```bash
git clone https://github.com/jameseperry/jira-mcp.git
cd jira-mcp
pip install -e .
```

## Configuration

### Environment Variables

```bash
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your_api_token_here
```

Get an API token from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens).

### Multiple Jira Instances

Add extra instances with `JIRA_BASE_URL_<name>`:

```bash
JIRA_BASE_URL=https://primary.atlassian.net
JIRA_BASE_URL_other=https://other.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your_api_token_here
```

Then pass `instance: "other"` to any tool to target that site. All instances share the same credentials.

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "jira": {
      "command": "jira-mcp",
      "env": {
        "JIRA_BASE_URL": "https://yourcompany.atlassian.net",
        "JIRA_EMAIL": "your.email@company.com",
        "JIRA_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

If installed with pipx, use the full path:

```json
{
  "command": "pipx",
  "args": ["run", "jira-mcp"]
}
```

Or point directly to the pipx-installed binary:

```json
{
  "command": "/home/you/.local/bin/jira-mcp"
}
```

## Tools

All tools accept an optional `instance` parameter for multi-instance support.

| Tool | Description |
|------|-------------|
| `jira_list_projects` | List accessible projects |
| `jira_search` | Search issues using JQL |
| `jira_get_issue` | Get detailed issue information |
| `jira_create_issue` | Create a new issue |
| `jira_update_issue` | Update an existing issue |
| `jira_assign_issue` | Assign or unassign an issue |
| `jira_add_comment` | Add a comment to an issue |
| `jira_get_transitions` | Get available status transitions |
| `jira_transition_issue` | Transition an issue to a new status |
| `jira_list_boards` | List agile boards |
| `jira_list_sprints` | List sprints for a board |
| `jira_create_sprint` | Create a new sprint |
| `jira_get_sprint_issues` | Get issues in a sprint |
| `jira_move_issues_to_sprint` | Move issues to a sprint |
| `jira_get_link_types` | Get available issue link types |
| `jira_link_issues` | Link two issues together |

## Project Structure

```
jira-mcp/
├── pyproject.toml
└── jira_mcp/
    ├── __init__.py
    ├── server.py          # FastMCP tool definitions
    ├── jira_client.py     # Jira API client (REST v3 + Agile v1.0)
    └── formatters.py      # ADF conversion, structured issue extraction
```

## Requirements

- Python 3.10+
- Jira Cloud (not self-hosted Jira Server/Data Center)
