import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "analyse-prescribing",
    "Guide the AI through a prescribing trend analysis workflow — " +
      "spending trends, regional comparisons, and practice-level data for a drug or BNF category.",
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "I want to analyse prescribing trends for an NHS drug or category. Please guide me through this workflow:",
              "",
              "1. **Identify the drug**: Ask me which drug or BNF category I want to analyse. Use prescriptions_search or prescriptions_cost_analysis to find data.",
              "2. **National spending trends**: Use prescriptions_spending_trends with the BNF code to show how spending has changed over time nationally.",
              "3. **Regional breakdown**: Use prescriptions_spending_trends with org_type='sicbl' to compare spending across Sub-ICB Locations.",
              "4. **Key findings**: Summarise the trends — is spending increasing or decreasing? Are there regional variations?",
              "5. **Next steps**: Suggest further analysis (e.g., drill into specific practices, compare with similar drugs).",
              "",
              "Start by asking me which drug or therapeutic area I'd like to explore.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.prompt(
    "compare-regions",
    "Compare prescribing patterns across NHS regions or practices for a given drug — " +
      "identify variation in prescribing rates and costs.",
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "I want to compare prescribing patterns across NHS regions. Please guide me through:",
              "",
              "1. **Choose the drug**: Ask me which drug or BNF code to compare.",
              "2. **Sub-ICB comparison**: Use prescriptions_spending_trends with org_type='sicbl' to get spending by Sub-ICB Location.",
              "3. **Identify outliers**: Highlight which regions have the highest/lowest prescribing rates and costs.",
              "4. **Practice-level drill-down**: For any interesting region, use prescriptions_search or prescriptions_spending_trends with org_type='practice' to see individual practices.",
              "5. **Summary**: Present findings — which regions prescribe more/less, and by how much?",
              "",
              "Start by asking me which drug or BNF category to compare across regions.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.prompt(
    "organisation-lookup",
    "Walk through finding and exploring an NHS organisation — " +
      "its details, relationships, and associated prescribing data.",
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "I want to find and explore an NHS organisation. Please guide me through:",
              "",
              "1. **Find the organisation**: Ask me for a name, postcode, or type. Use organisations_search to find matching organisations.",
              "2. **Organisation details**: Use organisations_get to show full details (address, roles, status).",
              "3. **Relationships**: Use organisations_relationships to show who the organisation reports to, is commissioned by, etc.",
              "4. **Prescribing data** (if applicable): If it's a GP practice, use prescriptions_search to show recent prescribing activity.",
              "5. **Summary**: Present an overview of the organisation and its place in the NHS structure.",
              "",
              "Start by asking me which organisation I'm looking for.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
