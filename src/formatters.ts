// Convert Atlassian Document Format to readable plain text
export function adfToText(adf: any): string {
  if (!adf || !adf.content) return "";
  return adf.content.map(nodeToText).join("\n\n");
}

function nodeToText(node: any): string {
  switch (node.type) {
    case "paragraph":
      return inlineToText(node.content);
    case "heading": {
      const level = node.attrs?.level || 1;
      return "#".repeat(level) + " " + inlineToText(node.content);
    }
    case "bulletList":
      return (node.content || [])
        .map((item: any) => "- " + listItemText(item))
        .join("\n");
    case "orderedList":
      return (node.content || [])
        .map((item: any, i: number) => `${i + 1}. ` + listItemText(item))
        .join("\n");
    case "codeBlock": {
      const lang = node.attrs?.language || "";
      return "```" + lang + "\n" + inlineToText(node.content) + "\n```";
    }
    case "blockquote":
      return (node.content || [])
        .map((c: any) => "> " + nodeToText(c))
        .join("\n");
    case "rule":
      return "---";
    case "table":
      return tableToText(node);
    default:
      return inlineToText(node.content);
  }
}

function inlineToText(content: any[]): string {
  if (!content) return "";
  return content
    .map((c: any) => {
      if (c.type === "text") return c.text || "";
      if (c.type === "hardBreak") return "\n";
      if (c.type === "mention") return `@${c.attrs?.text || c.attrs?.id || "unknown"}`;
      if (c.type === "emoji") return c.attrs?.shortName || "";
      if (c.type === "inlineCard") return c.attrs?.url || "";
      return c.text || "";
    })
    .join("");
}

function listItemText(item: any): string {
  return (item.content || []).map(nodeToText).join("\n  ");
}

function tableToText(node: any): string {
  const rows = (node.content || []).map((row: any) =>
    (row.content || [])
      .map((cell: any) => (cell.content || []).map(nodeToText).join(" "))
      .join(" | ")
  );
  return rows.join("\n");
}

// Convert plain text to ADF for Jira API v3
export function textToAdf(text: string) {
  return {
    type: "doc",
    version: 1,
    content: text.split("\n").map((line) => ({
      type: "paragraph" as const,
      content: line ? [{ type: "text" as const, text: line }] : [],
    })),
  };
}

// Format an issue object into readable text
export function formatIssue(issue: any): string {
  const f = issue.fields || {};
  const lines: string[] = [
    `${issue.key}: ${f.summary || "(no summary)"}`,
    `  Status: ${f.status?.name || "Unknown"}`,
    `  Type: ${f.issuetype?.name || "Unknown"}`,
  ];

  if (f.priority) lines.push(`  Priority: ${f.priority.name}`);
  if (f.assignee) lines.push(`  Assignee: ${f.assignee.displayName} (${f.assignee.accountId})`);
  if (f.reporter) lines.push(`  Reporter: ${f.reporter.displayName}`);
  if (f.labels?.length) lines.push(`  Labels: ${f.labels.join(", ")}`);
  if (f.components?.length)
    lines.push(`  Components: ${f.components.map((c: any) => c.name).join(", ")}`);
  if (f.fixVersions?.length)
    lines.push(`  Fix Versions: ${f.fixVersions.map((v: any) => v.name).join(", ")}`);
  if (f.sprint) lines.push(`  Sprint: ${f.sprint.name}`);
  if (f.parent) lines.push(`  Parent: ${f.parent.key}`);
  if (f.created) lines.push(`  Created: ${f.created}`);
  if (f.updated) lines.push(`  Updated: ${f.updated}`);
  if (f.resolution) lines.push(`  Resolution: ${f.resolution.name}`);

  if (f.description) {
    const desc = typeof f.description === "string" ? f.description : adfToText(f.description);
    lines.push(`  Description:\n    ${desc.split("\n").join("\n    ")}`);
  }

  return lines.join("\n");
}

// Format an issue as a compact one-liner for search results
export function formatIssueSummary(issue: any): string {
  const f = issue.fields || {};
  const assignee = f.assignee?.displayName || "Unassigned";
  return `${issue.key}  [${f.status?.name}]  ${f.summary}  (${f.issuetype?.name}, ${assignee})`;
}
