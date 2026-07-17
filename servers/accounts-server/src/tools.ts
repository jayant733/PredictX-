import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ExecuteTradeSchema, GetAccountSchema, GetPortfolioSchema,
  ListHoldingsSchema, ListTradesSchema, OpenAccountSchema,
} from "./schemas.js";
import { AccountsToolHandlers } from "./handlers.js";

/**
 * Tool registry: the single source of truth for what this MCP server
 * advertises. Each entry pairs the Zod input schema (sent to the LLM
 * as JSON Schema) with its handler function.
 *
 * The `description` is what the LLM reads to decide whether to call the
 * tool, so they are written for an autonomous agent audience.
 */

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: unknown) => unknown;
}

export function buildToolRegistry(handlers: AccountsToolHandlers): ToolDef[] {
  return [
    {
      name: "open_account",
      description: "Create a new synthetic trading account with a starting cash balance and strategy.",
      inputSchema: zodToJsonSchema(OpenAccountSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.open_account,
    },
    {
      name: "get_account",
      description: "Read a single account's balance and strategy metadata.",
      inputSchema: zodToJsonSchema(GetAccountSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.get_account,
    },
    {
      name: "list_accounts",
      description: "List every synthetic account on the trading floor.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      handler: () => handlers.list_accounts(),
    },
    {
      name: "list_holdings",
      description: "List the current open equity positions (holdings) for an account.",
      inputSchema: zodToJsonSchema(ListHoldingsSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.list_holdings,
    },
    {
      name: "list_trades",
      description: "Read the recent trade history (append-only ledger) for an account.",
      inputSchema: zodToJsonSchema(ListTradesSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.list_trades,
    },
    {
      name: "execute_trade",
      description:
        "Execute a synthetic buy or sell trade. Validates cash/shares, updates holdings and cash balance, " +
        "and appends an immutable record to the trade ledger. Always include a rationale.",
      inputSchema: zodToJsonSchema(ExecuteTradeSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.execute_trade,
    },
    {
      name: "get_portfolio",
      description: "Get a full portfolio summary for an account: balance, holdings, and recent trades.",
      inputSchema: zodToJsonSchema(GetPortfolioSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: handlers.get_portfolio,
    },
  ];
}
