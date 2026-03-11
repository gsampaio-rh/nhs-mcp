import type { OrganisationSummary, OrganisationDetail, CostAnalysisRecord, QueryResult } from "../types.js";

export function formatOrganisationSearchResults(organisations: OrganisationSummary[]): string {
  if (organisations.length === 0) {
    return "No organisations found matching the search criteria.";
  }

  const lines = [
    `Found ${organisations.length} organisation(s):\n`,
    "| ODS Code | Name | Status | Role | Post Code | Last Changed |",
    "|---|---|---|---|---|---|",
  ];

  for (const org of organisations) {
    lines.push(
      `| ${org.orgId} | ${org.name} | ${org.status} | ${org.primaryRoleDescription} | ${org.postCode || "N/A"} | ${org.lastChangeDate} |`,
    );
  }

  return lines.join("\n");
}

export function formatOrganisationDetail(org: OrganisationDetail): string {
  const lines = [
    `# ${org.name}\n`,
    `- **ODS Code**: \`${org.orgId}\``,
    `- **Status**: ${org.status}`,
    `- **Record Class**: ${org.recordClass}`,
    `- **Last Changed**: ${org.lastChangeDate}`,
  ];

  if (org.address) {
    const addressParts = [
      org.address.line1,
      org.address.line2,
      org.address.line3,
      org.address.town,
      org.address.county,
      org.address.postCode,
      org.address.country,
    ].filter(Boolean);
    lines.push(`- **Address**: ${addressParts.join(", ")}`);
  }

  if (org.roles.length > 0) {
    lines.push(`\n## Roles (${org.roles.length})\n`);
    lines.push("| Role ID | Primary | Status | Start | End |");
    lines.push("|---|---|---|---|---|");
    for (const role of org.roles) {
      lines.push(
        `| ${role.id} | ${role.primaryRole ? "Yes" : "No"} | ${role.status} | ${role.startDate ?? "N/A"} | ${role.endDate ?? "—"} |`,
      );
    }
  }

  if (org.relationships.length > 0) {
    lines.push(`\n## Relationships (${org.relationships.length})\n`);
    lines.push("| Rel ID | Target Org | Target Role | Status |");
    lines.push("|---|---|---|---|");
    for (const rel of org.relationships) {
      lines.push(`| ${rel.id} | ${rel.targetOrgId} | ${rel.targetPrimaryRoleId} | ${rel.status} |`);
    }
  }

  if (org.successors.length > 0) {
    lines.push(`\n## Succession History (${org.successors.length})\n`);
    for (const succ of org.successors) {
      lines.push(`- **${succ.type}** → \`${succ.targetOrgId}\``);
    }
  }

  return lines.join("\n");
}

function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

export function formatCostAnalysisResults(result: QueryResult<CostAnalysisRecord>): string {
  if (result.records.length === 0) {
    return "No cost analysis records found matching the search criteria.";
  }

  const lines = [
    `Found ${result.total} cost analysis record(s), showing ${result.records.length} (offset: ${result.offset}):\n`,
    "| BNF Code | Description | Items | Quantity | Net Cost | Actual Cost |",
    "|---|---|---|---|---|---|",
  ];

  for (const r of result.records) {
    lines.push(
      `| ${r.bnfCode} | ${r.bnfDescription} | ${r.items} | ${r.quantity} | ${formatCurrency(r.netIngredientCost)} | ${formatCurrency(r.actualCost)} |`,
    );
  }

  return lines.join("\n");
}
