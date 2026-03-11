import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDatasetTools } from "./tools/datasets.js";
import { registerPrescriptionTools } from "./tools/prescriptions.js";
import { registerOrganisationTools } from "./tools/organisations.js";
import { registerResources } from "./resources/catalogue.js";
import { registerPrompts } from "./prompts/templates.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nhs-mcp",
    version: "0.3.0",
  });

  registerDatasetTools(server);
  registerPrescriptionTools(server);
  registerOrganisationTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
