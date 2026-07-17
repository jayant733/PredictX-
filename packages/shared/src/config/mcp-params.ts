import { loadEnv, type Env } from "./env.js";
import type { McpServerParams } from "../types/mcp.js";

/**
 * Build the MCP server params arrays for traders and researchers.
 *
 * This is the TypeScript equivalent of the Python:
 *   trader_mcp_server_params = [accounts_server, push_server, market_mcp]
 *   researcher_mcp_server_params(name) = [fetch, brave_search, memory(name)]
 *
 * Each entry is a `McpServerParams` object that the orchestrator passes
 * to an MCP stdio client to spawn the server as a child process.
 */

// ── Home-made servers (our TypeScript MCP servers) ──

function accountsServerParams(): McpServerParams {
  return {
    command: "node",
    args: ["servers/accounts-server/dist/index.js"],
    clientSessionTimeoutSeconds: 30,
  };
}

function pushServerParams(): McpServerParams {
  return {
    command: "node",
    args: ["servers/push-server/dist/index.js"],
    clientSessionTimeoutSeconds: 30,
  };
}

// ── Market server: Polygon (paid/realtime) OR our free Yahoo fallback ──

function marketServerParams(env: Env): McpServerParams {
  if (env.POLYGON_API_KEY) {
    // Polygon MCP server (paid tier or free tier with 5/min limit)
    const isPaid = false; // TODO: add is_paid_polygon / is_realtime_polygon flags
    return {
      command: "npx",
      args: [
        "-y",
        "mcp_polygon@v0.1.0",
      ],
      env: { POLYGON_API_KEY: env.POLYGON_API_KEY },
      clientSessionTimeoutSeconds: 30,
    };
  }

  // Our home-made free market server (Yahoo Finance, no API key)
  return {
    command: "node",
    args: ["servers/market-server/dist/index.js"],
    clientSessionTimeoutSeconds: 30,
  };
}

// ── Trader MCP servers ──

export function traderMcpServerParams(env: Env = loadEnv()): McpServerParams[] {
  return [
    accountsServerParams(),
    pushServerParams(),
    marketServerParams(env),
  ];
}

// ── Researcher MCP servers ──

export function researcherMcpServerParams(
  agentName: string,
  env: Env = loadEnv(),
): McpServerParams[] {
  const braveEnv: Record<string, string> = {};
  if (env.BRAVE_API_KEY) braveEnv.BRAVE_API_KEY = env.BRAVE_API_KEY;

  const memoryBaseUrl = process.env.LIBSQL_BASE_URL ?? "file:./data/memory";
  const libsqlUrl = `${memoryBaseUrl}/${agentName}.db`;

  return [
    // Fetch: local headless browser to get web pages
    {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-fetch"],
      clientSessionTimeoutSeconds: 30,
    },
    // Brave Search: web search for financial news
    {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: braveEnv,
      clientSessionTimeoutSeconds: 30,
    },
    // Memory: persistent knowledge graph per agent (libsql-backed)
    {
      command: "npx",
      args: ["-y", "mcp-memory-libsql"],
      env: { LIBSQL_URL: libsqlUrl },
      clientSessionTimeoutSeconds: 30,
    },
  ];
}
