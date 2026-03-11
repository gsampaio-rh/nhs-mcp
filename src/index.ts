import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./mcp/server.js";
import { logger } from "./infrastructure/logger.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  logger.info("NHS MCP server started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("Failed to start NHS MCP server", { error: String(err) });
  process.exit(1);
});
