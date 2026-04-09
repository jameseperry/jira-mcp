import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";
import { formatIssueSummary } from "../formatters.js";

export function registerSprintTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_list_boards",
    "List Jira agile boards",
    {
      projectKeyOrId: z.string().optional().describe("Filter boards by project key or ID"),
      type: z.enum(["scrum", "kanban"]).optional().describe("Filter by board type"),
      maxResults: z.number().optional().describe("Maximum results (default 50)"),
    },
    async ({ projectKeyOrId, type, maxResults }) => {
      const params = new URLSearchParams();
      if (projectKeyOrId) params.set("projectKeyOrId", projectKeyOrId);
      if (type) params.set("type", type);
      if (maxResults) params.set("maxResults", String(maxResults));
      const data = await client.agileGet(`/board?${params}`);
      const boards = (data.values || []).map(
        (b: any) => `${b.id}: ${b.name} (${b.type})`
      );
      return {
        content: [
          {
            type: "text",
            text: boards.length ? boards.join("\n") : "No boards found.",
          },
        ],
      };
    }
  );

  server.tool(
    "jira_list_sprints",
    "List sprints for a board",
    {
      boardId: z.number().describe("Board ID (use jira_list_boards to find it)"),
      state: z
        .enum(["active", "closed", "future"])
        .optional()
        .describe("Filter by sprint state"),
    },
    async ({ boardId, state }) => {
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      const data = await client.agileGet(`/board/${boardId}/sprint?${params}`);
      const sprints = (data.values || []).map(
        (s: any) =>
          `${s.id}: ${s.name}  [${s.state}]${s.startDate ? `  ${s.startDate} → ${s.endDate}` : ""}${s.goal ? `\n    Goal: ${s.goal}` : ""}`
      );
      return {
        content: [
          {
            type: "text",
            text: sprints.length ? sprints.join("\n") : "No sprints found.",
          },
        ],
      };
    }
  );

  server.tool(
    "jira_create_sprint",
    "Create a new sprint",
    {
      name: z.string().describe("Sprint name"),
      boardId: z.number().describe("Board ID"),
      startDate: z.string().optional().describe("Start date (ISO 8601, e.g. 2024-01-15T09:00:00.000Z)"),
      endDate: z.string().optional().describe("End date (ISO 8601)"),
      goal: z.string().optional().describe("Sprint goal"),
    },
    async ({ name, boardId, startDate, endDate, goal }) => {
      const body: any = { name, originBoardId: boardId };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (goal) body.goal = goal;
      const result = await client.agilePost("/sprint", body);
      return {
        content: [
          {
            type: "text",
            text: `Created sprint "${result.name}" (id: ${result.id})`,
          },
        ],
      };
    }
  );

  server.tool(
    "jira_get_sprint_issues",
    "Get issues in a sprint",
    {
      sprintId: z.number().describe("Sprint ID"),
      maxResults: z.number().optional().describe("Maximum results (default 50)"),
    },
    async ({ sprintId, maxResults }) => {
      const params = new URLSearchParams();
      if (maxResults) params.set("maxResults", String(maxResults));
      params.set("fields", "summary,status,assignee,issuetype,priority");
      const data = await client.agileGet(`/sprint/${sprintId}/issue?${params}`);
      const issues = (data.issues || []).map(formatIssueSummary);
      return {
        content: [
          {
            type: "text",
            text: issues.length
              ? `Sprint issues (${data.total || issues.length} total):\n${issues.join("\n")}`
              : "No issues in this sprint.",
          },
        ],
      };
    }
  );

  server.tool(
    "jira_move_issues_to_sprint",
    "Move issues to a sprint",
    {
      sprintId: z.number().describe("Target sprint ID"),
      issueKeys: z
        .array(z.string())
        .describe("Issue keys to move (e.g. ['PROJ-1', 'PROJ-2'])"),
    },
    async ({ sprintId, issueKeys }) => {
      await client.agilePost(`/sprint/${sprintId}/issue`, {
        issues: issueKeys,
      });
      return {
        content: [
          {
            type: "text",
            text: `Moved ${issueKeys.length} issue(s) to sprint ${sprintId}: ${issueKeys.join(", ")}`,
          },
        ],
      };
    }
  );
}
