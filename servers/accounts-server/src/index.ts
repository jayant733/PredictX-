#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createLogger } from "@autonomous-traders/shared";
import { AccountsRepository } from "./db.js";
import { TradingService } from "./trading.js";
import { createHandlers } from "./handlers.js";
import { buildToolRegistry } from "./tools.js";

const log = createLogger("accounts-server");

/**
 * Entry point. Boots the home-made Accounts MCP server over stdio.
 *
 * Flow:
 *  1. Build repository (SQLite) + trading service + handlers.
 *  2. Register a tool registry with the MCP SDK Server.
 *  3. Connect the StdioServerTransport — the parent process (the agent)
 *     spawns this and talks JSON-RPC over stdin/stdout.
 *
 * Designed to be launched by the orchestrator with a single command:
 *   { "command": "node", "args": ["dist/index.js"] }
 */

async function main(): Promise<void> {
  const repo = new AccountsRepository();
  const trading = new TradingService(repo);
  const handlers = createHandlers({ repo, trading });
  const tools = buildToolRegistry(handlers);

  const server = new Server(
    { name: "accounts-server", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`unknown tool: ${name}`);
    try {
      const result = await tool.handler(req.params.arguments);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("tool call failed", { name, err: msg });
      return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("accounts-server listening on stdio", { tools: tools.length });
}

main().catch((err) => {
  log.error("fatal", { err: String(err) });
  process.exit(1);
});
