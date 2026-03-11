import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./mcp/server.js";
import { logger } from "./infrastructure/logger.js";

function parseArgs(): { transport: "stdio" | "http"; port: number } {
  const args = process.argv.slice(2);
  let transport: "stdio" | "http" = "stdio";
  let port = 3000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--transport" && args[i + 1]) {
      transport = args[i + 1] as "stdio" | "http";
      i++;
    }
    if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[i + 1]!, 10);
      i++;
    }
  }

  return { transport, port };
}

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("NHS MCP server started", { transport: "stdio" });
}

async function startHttp(port: number): Promise<void> {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const { createServer: createHttpServer } = await import("node:http");
  const { randomUUID } = await import("node:crypto");

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === "/mcp" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString());
      await transport.handleRequest(req, res, body);
    } else if (req.url === "/mcp" && req.method === "GET") {
      await transport.handleRequest(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", version: "0.3.0" }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(port, () => {
    logger.info("NHS MCP server started", { transport: "http", port, endpoint: `/mcp` });
  });
}

async function main(): Promise<void> {
  const { transport, port } = parseArgs();

  if (transport === "http") {
    await startHttp(port);
  } else {
    await startStdio();
  }
}

main().catch((err) => {
  logger.error("Failed to start NHS MCP server", { error: String(err) });
  process.exit(1);
});
