import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import { OdsClient } from "../../infrastructure/clients/ods.js";
import { listDatasets } from "../../application/use-cases/listDatasets.js";
import { formatDatasetList } from "../../application/formatters/datasetFormatter.js";
import { MemoryCache } from "../../infrastructure/cache/memoryCache.js";
import { config } from "../../infrastructure/config.js";

const datasetCache = new MemoryCache<string>();
const rolesCache = new MemoryCache<string>();

export function registerResources(server: McpServer): void {
  const nhsbsaClient = new NhsbsaClient();
  const odsClient = new OdsClient();

  server.resource(
    "datasets",
    "nhs://datasets",
    {
      description: "Catalogue of all available NHS datasets on the NHSBSA Open Data Portal",
      mimeType: "text/plain",
    },
    async () => {
      const cached = datasetCache.get("catalogue");
      if (cached) {
        return { contents: [{ uri: "nhs://datasets", text: cached, mimeType: "text/plain" }] };
      }

      const result = await listDatasets(nhsbsaClient, undefined, 100);
      if (!result.success) {
        return {
          contents: [{ uri: "nhs://datasets", text: `Error loading datasets: ${result.error}`, mimeType: "text/plain" }],
        };
      }

      const text = formatDatasetList(result.data);
      datasetCache.set("catalogue", text, config.cache.datasetCatalogueTtl);

      return { contents: [{ uri: "nhs://datasets", text, mimeType: "text/plain" }] };
    },
  );

  server.resource(
    "organisation-roles",
    "nhs://organisation-roles",
    {
      description:
        "List of valid ODS organisation role IDs and their descriptions. " +
        "Use these role IDs with the organisations_search tool to filter by organisation type.",
      mimeType: "text/plain",
    },
    async () => {
      const cached = rolesCache.get("roles");
      if (cached) {
        return { contents: [{ uri: "nhs://organisation-roles", text: cached, mimeType: "text/plain" }] };
      }

      const result = await odsClient.listRoles();
      if (!result.success) {
        return {
          contents: [{
            uri: "nhs://organisation-roles",
            text: `Error loading organisation roles: ${result.error}`,
            mimeType: "text/plain",
          }],
        };
      }

      const lines = [
        `# NHS Organisation Roles (${result.data.length})\n`,
        "| Role ID | Description | Primary Role |",
        "|---|---|---|",
      ];

      for (const role of result.data) {
        lines.push(`| ${role.id} | ${role.displayName} | ${role.primaryRole === "true" ? "Yes" : "No"} |`);
      }

      const text = lines.join("\n");
      rolesCache.set("roles", text, config.cache.organisationRolesTtl);

      return { contents: [{ uri: "nhs://organisation-roles", text, mimeType: "text/plain" }] };
    },
  );
}
