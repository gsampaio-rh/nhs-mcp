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

  server.resource(
    "bnf-codes",
    "nhs://bnf-codes",
    {
      description:
        "BNF (British National Formulary) code reference showing the therapeutic classification hierarchy. " +
        "Lists common top-level BNF sections and example codes for use with prescribing tools.",
      mimeType: "text/plain",
    },
    async () => {
      const text = [
        "# BNF Code Reference\n",
        "The British National Formulary (BNF) organises drugs into a hierarchical classification.",
        "Use these codes with prescriptions_search, prescriptions_cost_analysis, and prescriptions_spending_trends.\n",
        "## Code Structure\n",
        "- **Section** (2 digits): e.g., `02` = Cardiovascular System",
        "- **Subsection** (4 digits): e.g., `0212` = Lipid-Regulating Drugs",
        "- **Paragraph** (6 digits): e.g., `021200` = Lipid-Regulating Drugs",
        "- **Chemical** (9 digits): e.g., `0212000AA` = Atorvastatin",
        "- **Presentation** (15 digits): e.g., `0212000AAAAAAAA` = Atorvastatin 10mg tablets\n",
        "## Common BNF Sections\n",
        "| Code | Section |",
        "|---|---|",
        "| 01 | Gastro-Intestinal System |",
        "| 02 | Cardiovascular System |",
        "| 03 | Respiratory System |",
        "| 04 | Central Nervous System |",
        "| 05 | Infections |",
        "| 06 | Endocrine System |",
        "| 07 | Obstetrics, Gynaecology, and Urinary-Tract Disorders |",
        "| 08 | Malignant Disease and Immunosuppression |",
        "| 09 | Nutrition and Blood |",
        "| 10 | Musculoskeletal and Joint Diseases |",
        "| 11 | Eye |",
        "| 12 | Ear, Nose, and Oropharynx |",
        "| 13 | Skin |",
        "| 14 | Immunological Products and Vaccines |",
        "| 15 | Anaesthesia |\n",
        "## Common Drug Codes\n",
        "| Code | Drug |",
        "|---|---|",
        "| 0407010H0 | Paracetamol |",
        "| 0501013B0 | Amoxicillin |",
        "| 0212000AA | Atorvastatin |",
        "| 0602010V0 | Levothyroxine Sodium |",
        "| 0206020A0 | Amlodipine |",
        "| 0601021M0 | Metformin Hydrochloride |",
        "| 0301011R0 | Salbutamol |",
        "| 0403030Q0 | Sertraline Hydrochloride |",
        "| 0304010Y0 | Cetirizine Hydrochloride |",
        "| 0205051R0 | Ramipril |",
      ].join("\n");

      return { contents: [{ uri: "nhs://bnf-codes", text, mimeType: "text/plain" }] };
    },
  );
}
