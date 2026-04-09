import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";

export function registerTransitionTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_get_transitions",
    "Get available status transitions for an issue",
    {
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
    },
    async ({ issueKey }) => {
      const data = await client.get(
        `/issue/${encodeURIComponent(issueKey)}/transitions`
      );
      const transitions = (data.transitions || []).map(
        (t: any) => `${t.id}: ${t.name} → ${t.to?.name || "?"}`
      );
      return {
        content: [
          {
            type: "text",
            text: transitions.length
              ? `Available transitions for ${issueKey}:\n${transitions.join("\n")}`
              : `No transitions available for ${issueKey}`,
          },
        ],
      };
    }
  );

  server.tool(
    "jira_transition_issue",
    "Transition a Jira issue to a new status",
    {
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      transitionId: z
        .string()
        .describe("Transition ID (use jira_get_transitions to find valid IDs)"),
      comment: z
        .string()
        .optional()
        .describe("Optional comment to add with the transition"),
    },
    async ({ issueKey, transitionId, comment }) => {
      const body: any = {
        transition: { id: transitionId },
      };
      if (comment) {
        body.update = {
          comment: [
            {
              add: {
                body: {
                  type: "doc",
                  version: 1,
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: comment }],
                    },
                  ],
                },
              },
            },
          ],
        };
      }
      await client.post(
        `/issue/${encodeURIComponent(issueKey)}/transitions`,
        body
      );
      return {
        content: [{ type: "text", text: `Transitioned ${issueKey} (transition: ${transitionId})` }],
      };
    }
  );
}
