import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";
import { textToAdf } from "../formatters.js";

export function registerCommentTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_add_comment",
    "Add a comment to a Jira issue",
    {
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      body: z.string().describe("Comment body (plain text)"),
    },
    async ({ issueKey, body }) => {
      const result = await client.post(
        `/issue/${encodeURIComponent(issueKey)}/comment`,
        { body: textToAdf(body) }
      );
      return {
        content: [
          {
            type: "text",
            text: `Comment added to ${issueKey} (id: ${result.id})`,
          },
        ],
      };
    }
  );
}
