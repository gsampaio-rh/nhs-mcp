import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import { listDatasets, getDatasetMetadata } from "../../application/use-cases/listDatasets.js";
import { queryDataset } from "../../application/use-cases/queryDataset.js";
import { formatDatasetList, formatDatasetMetadata, formatQueryResult } from "../../application/formatters/datasetFormatter.js";

export function registerDatasetTools(server: McpServer): void {
  const client = new NhsbsaClient();

  server.registerTool(
    "datasets_list",
    {
      title: "List NHS Datasets",
      description:
        "List all available datasets on the NHSBSA Open Data Portal. " +
        "Returns dataset names, descriptions, and resource counts. " +
        "Optionally filter by a search term matching title or description.",
      inputSchema: {
        search_query: z
          .string()
          .optional()
          .describe("Optional text to filter datasets by title or description (e.g., 'prescribing', 'dental')"),
      },
    },
    async ({ search_query }) => {
      const result = await listDatasets(client, search_query);
      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatDatasetList(result.data) }] };
    },
  );

  server.registerTool(
    "datasets_metadata",
    {
      title: "Get Dataset Metadata",
      description:
        "Get detailed metadata for a specific NHS dataset, including its resources " +
        "(data files) with their IDs. Use the resource ID with the datasets_query tool " +
        "to query the actual data.",
      inputSchema: {
        dataset_id: z
          .string()
          .describe("The dataset name or ID (e.g., 'english-prescribing-data-epd')"),
      },
    },
    async ({ dataset_id }) => {
      const result = await getDatasetMetadata(client, dataset_id);
      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatDatasetMetadata(result.data) }] };
    },
  );

  server.registerTool(
    "datasets_query",
    {
      title: "Query Dataset",
      description:
        "Query a specific dataset resource on the NHSBSA Open Data Portal by resource ID. " +
        "Use datasets_metadata first to find resource IDs for a dataset. " +
        "Supports filtering by field values, pagination with limit and offset.",
      inputSchema: {
        resource_id: z
          .string()
          .describe("The resource ID to query (get this from datasets_metadata)"),
        filters: z
          .record(z.string(), z.string())
          .optional()
          .describe("Key-value pairs to filter records (e.g., { \"BNF_CODE\": \"0407010H0\" })"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of records to return (default 20, max 100)"),
        offset: z
          .number()
          .optional()
          .describe("Number of records to skip for pagination (default 0)"),
      },
    },
    async ({ resource_id, filters, limit, offset }) => {
      const result = await queryDataset(client, resource_id, { filters, limit, offset });
      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatQueryResult(result.data) }] };
    },
  );
}
