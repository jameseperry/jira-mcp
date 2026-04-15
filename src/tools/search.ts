import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";
import { formatIssueSummary } from "../formatters.js";

export function registerSearchTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_search",
    "Search Jira issues using JQL (Jira Query Language)",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      jql: z.string().describe("JQL query string (e.g. 'project = PROJ AND status = \"In Progress\"')"),
      maxResults: z.number().optional().describe("Maximum number of results (default 20, max 100)"),
      fields: z
        .array(z.string())
        .optional()
        .describe("Fields to include (default: summary, status, assignee, issuetype, priority)"),
    },
    async ({ instance, jql, maxResults, fields }) => {
      const jira = client.for(instance);
      const body: any = {
        jql,
        maxResults: Math.min(maxResults || 20, 100),
        fields: fields?.length
          ? fields
          : ["summary", "status", "assignee", "issuetype", "priority"],
      };

      const data = await jira.post("/search/jql", body);
      const issues = (data.issues || []).map(formatIssueSummary);
      return {
        content: [
          {
            type: "text",
            text: issues.length
              ? `Found ${issues.length} issue(s):\n${issues.join("\n")}`
              : "No issues found.",
          },
        ],
      };
    }
  );
}
