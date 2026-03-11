import type { PrescriptionRecord, QueryResult } from "../types.js";

function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

export function formatPrescriptionResults(result: QueryResult<PrescriptionRecord>): string {
  if (result.records.length === 0) {
    return "No prescription records found matching the search criteria.";
  }

  const lines = [
    `Found ${result.total} prescription record(s), showing ${result.records.length} (offset: ${result.offset}):\n`,
    "| BNF Code | Description | Practice | Items | Quantity | Net Cost | Actual Cost |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const r of result.records) {
    lines.push(
      `| ${r.bnfCode} | ${r.bnfDescription} | ${r.practiceName || r.practiceCode} | ${r.items} | ${r.quantity} | ${formatCurrency(r.netIngredientCost)} | ${formatCurrency(r.actualCost)} |`,
    );
  }

  return lines.join("\n");
}
