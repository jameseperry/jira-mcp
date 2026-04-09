#!/usr/bin/env node

// Smoke test: exercises read-only MCP tools against your Jira instance.
// Usage: JIRA_HOST=x JIRA_EMAIL=x JIRA_API_TOKEN=x node test-smoke.mjs

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const required = ["JIRA_HOST", "JIRA_EMAIL", "JIRA_API_TOKEN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  console.error("Usage: JIRA_HOST=... JIRA_EMAIL=... JIRA_API_TOKEN=... node test-smoke.mjs");
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: {
    JIRA_HOST: process.env.JIRA_HOST,
    JIRA_EMAIL: process.env.JIRA_EMAIL,
    JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
  },
});

const client = new Client({ name: "test-smoke", version: "0.1.0" });
await client.connect(transport);

console.log("Connected to jira-mcp server\n");

// --- Helpers ---

async function call(tool, args = {}) {
  const label = `${tool}(${JSON.stringify(args)})`;
  console.log(`▸ ${label}`);
  try {
    const result = await client.callTool({ name: tool, arguments: args });
    const text = result.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    console.log(text);
    console.log();
    return text;
  } catch (err) {
    console.error(`  ✗ ${err.message}\n`);
    return null;
  }
}

// --- List available tools ---

console.log("=== Available tools ===");
const { tools } = await client.listTools();
for (const t of tools) {
  console.log(`  • ${t.name} — ${t.description}`);
}
console.log(`\nTotal: ${tools.length} tools\n`);

// --- Run read-only tests ---

console.log("=== List Projects ===");
const projectsText = await call("jira_list_projects", { maxResults: 5 });

// Extract first project key for follow-up queries
const firstProjectKey = projectsText?.split("\n")[0]?.split(/\s+/)[0];

if (firstProjectKey) {
  console.log(`=== Search: recent issues in ${firstProjectKey} ===`);
  const searchText = await call("jira_search", {
    jql: `project = "${firstProjectKey}" ORDER BY created DESC`,
    maxResults: 5,
  });

  // Extract first issue key for detail lookup
  const firstIssueKey = searchText?.match(/^([A-Z]+-\d+)/m)?.[1];

  if (firstIssueKey) {
    console.log(`=== Get Issue: ${firstIssueKey} ===`);
    await call("jira_get_issue", { issueKey: firstIssueKey });

    console.log(`=== Transitions for ${firstIssueKey} ===`);
    await call("jira_get_transitions", { issueKey: firstIssueKey });
  }

  console.log(`=== Boards for ${firstProjectKey} ===`);
  const boardsText = await call("jira_list_boards", { projectKeyOrId: firstProjectKey });

  // Extract first board ID for sprint listing
  const firstBoardId = boardsText?.match(/^(\d+):/m)?.[1];
  if (firstBoardId) {
    console.log(`=== Sprints for board ${firstBoardId} ===`);
    await call("jira_list_sprints", { boardId: Number(firstBoardId) });
  }
} else {
  console.log("No projects found — running standalone queries\n");
  await call("jira_search", { jql: "ORDER BY created DESC", maxResults: 5 });
}

console.log("=== Link Types ===");
await call("jira_get_link_types");

// --- Done ---

console.log("✔ Smoke test complete");
await client.close();
