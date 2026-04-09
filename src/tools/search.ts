import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";
import { formatIssueSummary } from "../formatters.js";

export function registerSearchTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_search",
    "Search Jira issues using JQL (Jira Query Language)",
    {
      jql: z.string().describe("JQL query string (e.g. 'project = PROJ AND status = \"In Progress\"')"),
      maxResults: z.number().optional().describe("Maximum number of results (default 20, max 100)"),
      fields: z
        .array(z.string())
        .optional()
        .describe("Fields to include (default: summary, status, assignee, issuetype, priority)"),
    },
    async ({ jql, maxResults, fields }) => {
      const params = new URLSearchParams({
        jql,
        maxResults: String(Math.min(maxResults || 20, 100)),
      });
      if (fields?.length) {
        params.set("fields", fields.join(","));
      } else {
        params.set("fields", "summary,status,assignee,issuetype,priority");
      }
      const data = await client.get(`/search?${params}`);
      const total = data.total || 0;
      const issues = (data.issues || []).map(formatIssueSummary);
      const header = `Found ${total} issue(s)${total > issues.length ? ` (showing ${issues.length})` : ""}:\n`;
      return {
        content: [{ type: "text", text: issues.length ? header + issues.join("\n") : "No issues found." }],
      };
    }
  );
}
