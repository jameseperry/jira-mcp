import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";

export function registerLinkTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_get_link_types",
    "Get available issue link types",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
    },
    async ({ instance }) => {
      const data = await client.for(instance).get("/issueLinkType");
      const types = (data.issueLinkTypes || []).map(
        (t: any) => `${t.name}  (inward: "${t.inward}", outward: "${t.outward}")`
      );
      return {
        content: [
          {
            type: "text",
            text: types.length
              ? `Available link types:\n${types.join("\n")}`
              : "No link types found.",
          },
        ],
      };
    }
  );

  server.tool(
    "jira_link_issues",
    "Create a link between two Jira issues",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      linkType: z.string().describe("Link type name (e.g. 'Blocks', 'Duplicate', 'Relates')"),
      inwardIssueKey: z.string().describe("Inward issue key (e.g. the issue being blocked)"),
      outwardIssueKey: z.string().describe("Outward issue key (e.g. the blocking issue)"),
    },
    async ({ instance, linkType, inwardIssueKey, outwardIssueKey }) => {
      await client.for(instance).post("/issueLink", {
        type: { name: linkType },
        inwardIssue: { key: inwardIssueKey },
        outwardIssue: { key: outwardIssueKey },
      });
      return {
        content: [
          {
            type: "text",
            text: `Linked ${inwardIssueKey} ←[${linkType}]→ ${outwardIssueKey}`,
          },
        ],
      };
    }
  );
}
