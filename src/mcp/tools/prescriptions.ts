import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import { searchPrescriptions } from "../../application/use-cases/searchPrescriptions.js";
import { getCostAnalysis } from "../../application/use-cases/getCostAnalysis.js";
import { formatPrescriptionResults } from "../../application/formatters/prescriptionFormatter.js";
import { formatCostAnalysisResults } from "../../application/formatters/organisationFormatter.js";
import { withErrorHandling } from "./errorHandler.js";

const EPD_RESOURCE_ID = "EPD_202404";

export function registerPrescriptionTools(server: McpServer): void {
  const client = new NhsbsaClient();

  server.registerTool(
    "prescriptions_search",
    {
      title: "Search Prescriptions",
      description:
        "Search NHS prescribing data from the English Prescribing Dataset (EPD). " +
        "Find prescription records by BNF code, drug name, practice code, or time period. " +
        "Returns items dispensed, quantities, and costs. " +
        "At least one search parameter should be provided.",
      inputSchema: {
        bnf_code: z
          .string()
          .optional()
          .describe(
            "BNF code to filter by (e.g., '0407010H0' for Paracetamol). " +
            "Supports partial codes for broader category searches.",
          ),
        drug_name: z
          .string()
          .optional()
          .describe("Free-text search for drug name (e.g., 'Paracetamol', 'Amoxicillin')"),
        practice_code: z
          .string()
          .optional()
          .describe("GP practice code to filter by (e.g., 'A81001')"),
        year_month: z
          .string()
          .optional()
          .describe("Year and month in YYYYMM format (e.g., '202401' for January 2024)"),
        resource_id: z
          .string()
          .optional()
          .describe(
            "Specific EPD resource ID to query. If not provided, uses a default dataset. " +
            "Use datasets_metadata on 'english-prescribing-data-epd' to find available resource IDs.",
          ),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of records to return (default 20, max 100)"),
      },
    },
    withErrorHandling("prescriptions_search", async ({ bnf_code, drug_name, practice_code, year_month, resource_id, limit }) => {
      const targetResource = resource_id ?? EPD_RESOURCE_ID;

      const result = await searchPrescriptions(
        client,
        { bnfCode: bnf_code, drugName: drug_name, practiceCode: practice_code, yearMonth: year_month, limit },
        targetResource,
      );

      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatPrescriptionResults(result.data) }] };
    }),
  );

  server.registerTool(
    "prescriptions_cost_analysis",
    {
      title: "Prescription Cost Analysis",
      description:
        "Get prescription cost statistics from the national Prescription Cost Analysis (PCA) dataset. " +
        "Shows aggregate costs and volumes at the national level (not by practice). " +
        "Use prescriptions_search for practice-level data instead.",
      inputSchema: {
        bnf_code: z
          .string()
          .optional()
          .describe("BNF code to filter by (e.g., '0407010H0' for Paracetamol)"),
        bnf_name: z
          .string()
          .optional()
          .describe("Free-text search for drug or chemical substance name"),
        year_month: z
          .string()
          .optional()
          .describe("Year and month in YYYYMM format (e.g., '202401')"),
        resource_id: z
          .string()
          .optional()
          .describe(
            "Specific PCA resource ID. If omitted, the server will auto-discover the latest PCA resource.",
          ),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of records to return (default 20, max 100)"),
      },
    },
    withErrorHandling("prescriptions_cost_analysis", async ({ bnf_code, bnf_name, year_month, resource_id, limit }) => {
      const result = await getCostAnalysis(
        client,
        { bnfCode: bnf_code, bnfName: bnf_name, yearMonth: year_month, limit },
        resource_id,
      );

      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatCostAnalysisResults(result.data) }] };
    }),
  );
}
