# JIRA MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with seamless access to Jira Cloud. This enables AI tools like Claude to read, create, update, and manage Jira issues, sprints, comments, and more.

## Features

### Issue Management
- **Search issues** using JQL (Jira Query Language)
- **Get detailed issue information** including status, assignee, description, and custom fields
- **Create new issues** with support for tasks, bugs, stories, epics, and subtasks
- **Update existing issues** including summary, description, assignee, priority, and labels
- **Assign/unassign issues** to team members

### Comments
- **Add comments** to issues with plain text (automatically converted to Atlassian Document Format)

### Workflows
- **View available transitions** for any issue
- **Transition issues** through your workflow (e.g., move from "To Do" to "In Progress")
- **Add comments** during transitions

### Sprint & Agile
- **List agile boards** (Scrum and Kanban)
- **View sprints** with filtering by state (active, closed, future)
- **Create new sprints** with start/end dates and goals
- **View sprint issues**
- **Move issues to sprints**

### Issue Links
- **Get link types** (Blocks, Duplicate, Relates, etc.)
- **Link issues** together with relationship types

### Project Management
- **List all accessible projects** with key, name, and type information

## Prerequisites

- **Node.js** 18 or higher
- **Jira Cloud instance** (not self-hosted Jira)
- **Jira API token** from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

## Installation

1. Clone or download this repository:
```bash
git clone <repository-url>
cd jira-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file (or set environment variables) with your Jira credentials:

```bash
# Your Jira Cloud base URL (e.g. https://mycompany.atlassian.net)
JIRA_BASE_URL=https://yourcompany.atlassian.net

# Email associated with your Atlassian account
JIRA_EMAIL=your.email@company.com

# API token from https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_API_TOKEN=your_api_token_here
```

### Getting Your API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "MCP Server")
4. Copy the token and save it securely

## Usage

### General MCP Usage

The server communicates via stdio and can be used with any MCP-compatible client. To start the server manually:

```bash
node dist/index.js
```

The server requires the environment variables to be set before running.

### Testing

A smoke test script is included to verify your setup:

```bash
# Build first
npm run build

# Run the smoke test
JIRA_BASE_URL=https://yourcompany.atlassian.net \
JIRA_EMAIL=your.email@company.com \
JIRA_API_TOKEN=your_token \
node test-smoke.mjs
```

This will list available tools and run read-only operations against your Jira instance.

## Using with Claude Code

Claude Code is Anthropic's official CLI tool that supports MCP servers. Here's how to connect this Jira MCP:

### Setup for Claude Code

1. **Build the JIRA MCP server** (if not already done):
```bash
cd /path/to/jira-mcp
npm install
npm run build
```

2. **Configure Claude Code** to use the JIRA MCP server. Edit your Claude Code MCP configuration file:

**On macOS/Linux:**
```bash
~/.config/claude-code/mcp_config.json
```

**On Windows:**
```
%APPDATA%\claude-code\mcp_config.json
```

3. **Add the JIRA MCP server** to your configuration:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/absolute/path/to/jira-mcp/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://yourcompany.atlassian.net",
        "JIRA_EMAIL": "your.email@company.com",
        "JIRA_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/jira-mcp` with the actual absolute path to where you cloned this repository.

4. **Restart Claude Code** or reload the configuration.

### Example Prompts for Claude Code

Once configured, you can use natural language to interact with Jira:

**Search for issues:**
```
Show me all high-priority bugs in project MYAPP that are in progress
```

**Create an issue:**
```
Create a new bug in project MYAPP titled "Login button not working" with high priority
```

**Get issue details:**
```
Show me the details of MYAPP-123
```

**Update an issue:**
```
Update MYAPP-123 to set the priority to High and add the label "urgent"
```

**Manage workflow:**
```
What transitions are available for MYAPP-123?
Move MYAPP-123 to In Progress with a comment saying "Starting work on this"
```

**Sprint management:**
```
Show me all sprints for the MYAPP project
What issues are in the current sprint?
Move MYAPP-123 and MYAPP-124 to sprint 42
```

**Link issues:**
```
Link MYAPP-123 as blocking MYAPP-124
```

Claude Code will automatically use the appropriate JIRA MCP tools to fulfill these requests.

## Available MCP Tools

The server exposes the following tools to MCP clients:

### Projects
- `jira_list_projects` - List all accessible projects

### Search
- `jira_search` - Search issues using JQL

### Issues
- `jira_get_issue` - Get detailed issue information
- `jira_create_issue` - Create a new issue
- `jira_update_issue` - Update an existing issue
- `jira_assign_issue` - Assign/unassign an issue

### Comments
- `jira_add_comment` - Add a comment to an issue

### Transitions
- `jira_get_transitions` - Get available status transitions
- `jira_transition_issue` - Move an issue through workflow

### Sprints & Boards
- `jira_list_boards` - List agile boards
- `jira_list_sprints` - List sprints for a board
- `jira_create_sprint` - Create a new sprint
- `jira_get_sprint_issues` - Get issues in a sprint
- `jira_move_issues_to_sprint` - Move issues to a sprint

### Links
- `jira_get_link_types` - Get available link types
- `jira_link_issues` - Link two issues together

## Development

### Project Structure

```
jira-mcp/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── jira-client.ts        # Jira API client wrapper
│   ├── formatters.ts         # ADF ↔ text conversion utilities
│   └── tools/
│       ├── projects.ts       # Project listing tools
│       ├── search.ts         # JQL search tools
│       ├── issues.ts         # Issue CRUD operations
│       ├── comments.ts       # Comment management
│       ├── transitions.ts    # Workflow transitions
│       ├── sprints.ts        # Sprint and board tools
│       └── links.ts          # Issue linking tools
├── package.json
├── tsconfig.json
└── test-smoke.mjs           # Smoke test script
```

### Building

```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode for development
```

### Technologies Used

- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)** - MCP SDK for tool registration and stdio communication
- **[Zod](https://zod.dev/)** - Schema validation for tool parameters
- **TypeScript** - Type-safe development
- **Jira REST API v3** - Issue and project management
- **Jira Agile REST API v1.0** - Sprint and board management

## API Authentication

This server uses HTTP Basic Authentication with your Jira email and API token. The credentials are base64-encoded and sent in the `Authorization` header for each request.

**Security note:** Keep your API token secure. Never commit it to version control. Use environment variables or secure secret management.

## Limitations

- Requires **Jira Cloud** (Atlassian-hosted). Self-hosted Jira Server/Data Center use different APIs.
- Currently supports the most common operations. Advanced features (custom fields, advanced workflows, etc.) may require additional tool implementations.
- Text descriptions and comments are converted to/from Atlassian Document Format (ADF). Complex formatting may not be fully preserved.

## Troubleshooting

**"Missing required environment variables" error:**
- Ensure `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` are set correctly
- Check that your `.env` file is in the correct location or variables are exported

**"Jira API error 401" (Unauthorized):**
- Verify your API token is correct and not expired
- Ensure the email matches the account that created the token
- Regenerate the API token if needed

**"Jira API error 403" (Forbidden):**
- Check that your Jira user has permission to perform the requested action
- Some operations require specific project or global permissions

**"Jira API error 404" (Not Found):**
- Verify the issue key, project key, or other identifiers are correct
- Ensure you have access to the specified resource

## Contributing

Contributions are welcome! Areas for enhancement:

- Support for custom fields
- Attachment upload/download
- Bulk operations
- Advanced JQL query builder helpers
- Webhook integration
- Support for Jira Service Management

## License

[Specify your license here]

## Resources

- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Jira Agile REST API](https://developer.atlassian.com/cloud/jira/software/rest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://claude.com/claude-code)
