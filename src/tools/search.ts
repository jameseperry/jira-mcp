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
      nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
    },
    async ({ jql, maxResults, fields, nextPageToken }) => {
      const body: any = {
        jql,
        maxResults: Math.min(maxResults || 20, 100),
        fields: fields?.length
          ? fields
          : ["summary", "status", "assignee", "issuetype", "priority"],
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;

      const data = await client.post("/search/jql", body);
      const issues = (data.issues || []).map(formatIssueSummary);
      const parts: string[] = [];
      if (issues.length) {
        parts.push(`Found ${issues.length} issue(s):\n${issues.join("\n")}`);
      } else {
        parts.push("No issues found.");
      }
      if (data.nextPageToken) {
        parts.push(`\nMore results available — nextPageToken: ${data.nextPageToken}`);
      }
      return {
        content: [{ type: "text", text: parts.join("\n") }],
      };
    }
  );
}
