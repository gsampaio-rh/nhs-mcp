import type { DatasetSummary, DatasetMetadata, QueryResult } from "../types.js";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function formatDatasetList(datasets: DatasetSummary[]): string {
  if (datasets.length === 0) {
    return "No datasets found.";
  }

  const lines = [`Found ${datasets.length} dataset(s):\n`];

  for (const ds of datasets) {
    const description = ds.notes ? ` — ${truncate(ds.notes, 120)}` : "";
    lines.push(`- **${ds.title}** (\`${ds.name}\`)${description} [${ds.numResources} resource(s)]`);
  }

  return lines.join("\n");
}

export function formatDatasetMetadata(metadata: DatasetMetadata): string {
  const lines = [
    `# ${metadata.title}\n`,
    `- **ID**: \`${metadata.id}\``,
    `- **Name**: \`${metadata.name}\``,
    `- **Organisation**: ${metadata.organization ?? "N/A"}`,
    `- **Last Modified**: ${metadata.metadataModified}`,
  ];

  if (metadata.notes) {
    lines.push(`\n${metadata.notes}`);
  }

  if (metadata.resources.length > 0) {
    lines.push(`\n## Resources (${metadata.resources.length})\n`);
    lines.push("| Name | Format | Datastore | Resource ID |");
    lines.push("|---|---|---|---|");

    for (const r of metadata.resources) {
      const active = r.datastoreActive ? "Yes" : "No";
      lines.push(`| ${r.name} | ${r.format} | ${active} | \`${r.id}\` |`);
    }
  }

  return lines.join("\n");
}

export function formatQueryResult(result: QueryResult<Record<string, unknown>>): string {
  if (result.records.length === 0) {
    return "No records found.";
  }

  const columns = Object.keys(result.records[0]!);
  const header = `Showing ${result.records.length} of ${result.total} record(s) (offset: ${result.offset}):\n`;
  const tableHeader = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;

  const rows = result.records.map((record) => {
    const values = columns.map((col) => {
      const val = record[col];
      if (val === null || val === undefined) return "";
      return String(val);
    });
    return `| ${values.join(" | ")} |`;
  });

  return [header, tableHeader, separator, ...rows].join("\n");
}
