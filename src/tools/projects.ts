import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";

export function registerProjectTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_list_projects",
    "List all accessible Jira projects",
    {
      maxResults: z.number().optional().describe("Maximum number of projects to return (default 50)"),
    },
    async ({ maxResults }) => {
      const params = new URLSearchParams();
      if (maxResults) params.set("maxResults", String(maxResults));
      const data = await client.get(`/project/search?${params}`);
      const projects = (data.values || []).map((p: any) =>
        `${p.key}  ${p.name}  (${p.projectTypeKey})`
      );
      return {
        content: [{ type: "text", text: projects.length ? projects.join("\n") : "No projects found." }],
      };
    }
  );
}
