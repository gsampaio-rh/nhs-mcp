import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OdsClient } from "../../infrastructure/clients/ods.js";
import { searchOrganisations } from "../../application/use-cases/searchOrganisations.js";
import { getOrganisation } from "../../application/use-cases/getOrganisation.js";
import {
  formatOrganisationSearchResults,
  formatOrganisationDetail,
} from "../../application/formatters/organisationFormatter.js";
import { withErrorHandling } from "./errorHandler.js";

export function registerOrganisationTools(server: McpServer): void {
  const client = new OdsClient();

  server.registerTool(
    "organisations_search",
    {
      title: "Search NHS Organisations",
      description:
        "Search for NHS organisations (GP practices, trusts, ICBs, pharmacies, etc.) " +
        "by name, role, or postcode using the ODS ORD directory. " +
        "Returns ODS codes, names, statuses, and primary roles. " +
        "At least one search parameter (name, role, or postcode) is required.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("Organisation name to search for (e.g., 'Leeds Teaching', 'Boots')"),
        role: z
          .string()
          .optional()
          .describe(
            "Primary ODS role ID to filter by (e.g., 'RO76' for GP practices, " +
            "'RO197' for NHS trusts, 'RO182' for pharmacies). " +
            "Use the nhs://organisation-roles resource to see all valid role IDs.",
          ),
        postcode: z
          .string()
          .optional()
          .describe("Postcode to search by (e.g., 'LS1', 'SW1A 1AA')"),
        status: z
          .enum(["Active", "Inactive"])
          .optional()
          .describe("Filter by organisation status. Default returns both active and inactive."),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of results to return (default 20, max 1000)"),
        offset: z
          .number()
          .optional()
          .describe("Number of results to skip for pagination (default 0)"),
      },
    },
    withErrorHandling("organisations_search", async ({ name, role, postcode, status, limit, offset }) => {
      const result = await searchOrganisations(client, {
        name,
        role,
        postCode: postcode,
        status,
        limit,
        offset,
      });

      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatOrganisationSearchResults(result.data) }] };
    }),
  );

  server.registerTool(
    "organisations_get",
    {
      title: "Get Organisation Details",
      description:
        "Get full details for a specific NHS organisation by its ODS code. " +
        "Returns name, address, roles, relationships, and succession history. " +
        "Use organisations_search first to find the ODS code.",
      inputSchema: {
        ods_code: z
          .string()
          .describe("The ODS code of the organisation (e.g., 'RR8' for Leeds Teaching Hospitals, 'A81001' for a GP practice)"),
      },
    },
    withErrorHandling("organisations_get", async ({ ods_code }) => {
      const result = await getOrganisation(client, ods_code);

      if (!result.success) {
        return { content: [{ type: "text", text: result.error }], isError: true };
      }
      return { content: [{ type: "text", text: formatOrganisationDetail(result.data) }] };
    }),
  );
}
