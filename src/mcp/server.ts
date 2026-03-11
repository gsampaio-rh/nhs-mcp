import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDatasetTools } from "./tools/datasets.js";
import { registerPrescriptionTools } from "./tools/prescriptions.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nhs-mcp",
    version: "0.1.0",
  });

  registerDatasetTools(server);
  registerPrescriptionTools(server);

  return server;
}
