import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JiraClient } from "../jira-client.js";
import { formatIssue, textToAdf } from "../formatters.js";

export function registerIssueTools(server: McpServer, client: JiraClient) {
  server.tool(
    "jira_get_issue",
    "Get detailed information about a specific Jira issue",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
    },
    async ({ instance, issueKey }) => {
      const issue = await client.for(instance).get(`/issue/${encodeURIComponent(issueKey)}`);
      return {
        content: [{ type: "text", text: formatIssue(issue) }],
      };
    }
  );

  server.tool(
    "jira_create_issue",
    "Create a new Jira issue",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      projectKey: z.string().describe("Project key (e.g. PROJ)"),
      issueType: z.string().describe("Issue type (e.g. Task, Bug, Story, Epic)"),
      summary: z.string().describe("Issue summary/title"),
      description: z.string().optional().describe("Issue description (plain text)"),
      assigneeId: z.string().optional().describe("Assignee account ID"),
      priority: z.string().optional().describe("Priority name (e.g. High, Medium, Low)"),
      labels: z.array(z.string()).optional().describe("Labels to apply"),
      parentKey: z.string().optional().describe("Parent issue key (for subtasks or child issues)"),
    },
    async ({ instance, projectKey, issueType, summary, description, assigneeId, priority, labels, parentKey }) => {
      const jira = client.for(instance);
      const fields: any = {
        project: { key: projectKey },
        issuetype: { name: issueType },
        summary,
      };
      if (description) fields.description = textToAdf(description);
      if (assigneeId) fields.assignee = { accountId: assigneeId };
      if (priority) fields.priority = { name: priority };
      if (labels) fields.labels = labels;
      if (parentKey) fields.parent = { key: parentKey };

      const result = await jira.post("/issue", { fields });
      return {
        content: [
          {
            type: "text",
            text: `Created ${result.key}\nURL: ${result.self?.replace(/\/rest\/api\/3\/issue\/.*/, `/browse/${result.key}`) || result.key}`,
          },
        ],
      };
    }
  );

  server.tool(
    "jira_update_issue",
    "Update fields on an existing Jira issue",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      summary: z.string().optional().describe("New summary"),
      description: z.string().optional().describe("New description (plain text)"),
      assigneeId: z.string().optional().describe("Assignee account ID (use 'none' to unassign)"),
      priority: z.string().optional().describe("Priority name"),
      labels: z.array(z.string()).optional().describe("Labels (replaces existing)"),
    },
    async ({ instance, issueKey, summary, description, assigneeId, priority, labels }) => {
      const jira = client.for(instance);
      const fields: any = {};
      if (summary) fields.summary = summary;
      if (description) fields.description = textToAdf(description);
      if (assigneeId === "none") {
        fields.assignee = null;
      } else if (assigneeId) {
        fields.assignee = { accountId: assigneeId };
      }
      if (priority) fields.priority = { name: priority };
      if (labels) fields.labels = labels;

      await jira.put(`/issue/${encodeURIComponent(issueKey)}`, { fields });
      return {
        content: [{ type: "text", text: `Updated ${issueKey}` }],
      };
    }
  );

  server.tool(
    "jira_assign_issue",
    "Assign a Jira issue to a user",
    {
      instance: z.string().optional().describe("Jira instance name (omit for default)"),
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      accountId: z
        .string()
        .describe("Atlassian account ID of the assignee, or 'none' to unassign"),
    },
    async ({ instance, issueKey, accountId }) => {
      await client.for(instance).put(`/issue/${encodeURIComponent(issueKey)}/assignee`, {
        accountId: accountId === "none" ? null : accountId,
      });
      const action = accountId === "none" ? "Unassigned" : `Assigned to ${accountId}`;
      return {
        content: [{ type: "text", text: `${action}: ${issueKey}` }],
      };
    }
  );
}
