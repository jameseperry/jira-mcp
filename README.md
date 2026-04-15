# jira-mcp

An MCP (Model Context Protocol) server that lets AI assistants interact with Jira Cloud — search issues, create and update tickets, manage sprints, and more.

## Setup

### 1. Get a Jira API token

Create one at https://id.atlassian.com/manage-profile/security/api-tokens

### 2. Install and build

```bash
npm install
npm run build
```

### 3. Configure your MCP client

Add to your MCP settings (e.g. VS Code `settings.json`, Claude Desktop config, etc.):

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/path/to/jira-mcp/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://yourcompany.atlassian.net",
        "JIRA_EMAIL": "you@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Multiple Jira instances

If you work across multiple Atlassian Cloud sites, add extra instances with `JIRA_BASE_URL_<name>`:

```json
{
  "env": {
    "JIRA_BASE_URL": "https://primary.atlassian.net",
    "JIRA_BASE_URL_other": "https://other.atlassian.net",
    "JIRA_EMAIL": "you@example.com",
    "JIRA_API_TOKEN": "your-api-token"
  }
}
```

Then pass `instance: "other"` to any tool to target that site. Omitting `instance` uses the default.

## Tools

### Projects

| Tool | Description |
|------|-------------|
| `jira_list_projects` | List all accessible projects |

### Search

| Tool | Description |
|------|-------------|
| `jira_search` | Search issues using JQL |

### Issues

| Tool | Description |
|------|-------------|
| `jira_get_issue` | Get detailed info about an issue |
| `jira_create_issue` | Create a new issue |
| `jira_update_issue` | Update fields on an issue |
| `jira_assign_issue` | Assign/unassign an issue |

### Comments

| Tool | Description |
|------|-------------|
| `jira_add_comment` | Add a comment to an issue |

### Transitions

| Tool | Description |
|------|-------------|
| `jira_get_transitions` | List available status transitions |
| `jira_transition_issue` | Move an issue to a new status |

### Sprints

| Tool | Description |
|------|-------------|
| `jira_list_boards` | List agile boards |
| `jira_list_sprints` | List sprints for a board |
| `jira_create_sprint` | Create a new sprint |
| `jira_get_sprint_issues` | Get issues in a sprint |
| `jira_move_issues_to_sprint` | Move issues to a sprint |

### Links

| Tool | Description |
|------|-------------|
| `jira_get_link_types` | List available link types |
| `jira_link_issues` | Link two issues together |

## Testing

A read-only smoke test is included. Set env vars and run:

```bash
JIRA_BASE_URL=https://yourcompany.atlassian.net \
JIRA_EMAIL=you@example.com \
JIRA_API_TOKEN=your-token \
node test-smoke.mjs
```

This connects as an MCP client, lists tools, and exercises read-only operations (list projects, search, get issue details, list boards/sprints, etc.). Nothing is created or modified.
