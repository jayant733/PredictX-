import { z } from "zod";

/**
 * Zod input schemas for every MCP tool this server exposes.
 * The MCP SDK turns these into the JSON Schema the LLM sees, so the
 * `description` strings are the prompt the model uses to decide when
 * to call the tool — keep them clear and imperative.
 */

export const OpenAccountSchema = z.object({
  id: z.string().describe("Unique account id, e.g. 'trader-warren'"),
  traderName: z.string().describe("Human-readable trader name"),
  cashBalance: z.number().positive().describe("Starting cash in USD"),
  strategy: z.string().describe("Free-text description of the investment strategy"),
  riskProfile: z
    .enum(["conservative", "balanced", "aggressive"])
    .describe("Risk appetite for this account"),
});
export type OpenAccountArgs = z.infer<typeof OpenAccountSchema>;

export const GetAccountSchema = z.object({
  accountId: z.string().describe("The account id to look up"),
});
export type GetAccountArgs = z.infer<typeof GetAccountSchema>;

export const ListHoldingsSchema = z.object({
  accountId: z.string().describe("The account id whose holdings to list"),
});
export type ListHoldingsArgs = z.infer<typeof ListHoldingsSchema>;

export const ListTradesSchema = z.object({
  accountId: z.string().describe("The account id whose trade history to list"),
  limit: z.number().int().positive().max(100).default(20).describe("Max trades to return"),
});
export type ListTradesArgs = z.infer<typeof ListTradesSchema>;

export const ExecuteTradeSchema = z.object({
  accountId: z.string().describe("Account to trade in"),
  ticker: z.string().min(1).max(8).describe("Stock ticker, e.g. 'AAPL'"),
  side: z.enum(["buy", "sell"]).describe("Direction of the trade"),
  shares: z.number().positive().describe("Number of shares"),
  price: z.number().positive().describe("Price per share in USD"),
  rationale: z.string().min(1).describe("Short reason for the trade (audit log)"),
});
export type ExecuteTradeArgs = z.infer<typeof ExecuteTradeSchema>;

export const GetPortfolioSchema = z.object({
  accountId: z.string().describe("Account id to summarise"),
});
export type GetPortfolioArgs = z.infer<typeof GetPortfolioSchema>;
