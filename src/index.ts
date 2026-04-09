#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { JiraClient } from "./jira-client.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerSearchTools } from "./tools/search.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerTransitionTools } from "./tools/transitions.js";
import { registerSprintTools } from "./tools/sprints.js";
import { registerLinkTools } from "./tools/links.js";

const server = new McpServer({
  name: "jira-mcp",
  version: "0.1.0",
});

const client = new JiraClient();

registerProjectTools(server, client);
registerSearchTools(server, client);
registerIssueTools(server, client);
registerCommentTools(server, client);
registerTransitionTools(server, client);
registerSprintTools(server, client);
registerLinkTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
