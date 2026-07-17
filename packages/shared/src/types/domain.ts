/**
 * Core financial domain types used across the whole monorepo.
 * Kept framework-agnostic — no MCP/LLM imports here.
 */

/** Ticker symbol, e.g. "AAPL". Normalised to upper-case on use. */
export type Ticker = string;

/** A cash amount in USD. Stored as a plain number; format only on display. */
export type Usd = number;

/** Side of a trade. */
export type TradeSide = "buy" | "sell";

/** Risk appetite baked into a trader's strategy. */
export type RiskProfile = "conservative" | "balanced" | "aggressive";

/** A single synthetic trading account owned by one trader. */
export interface Account {
  id: string;
  traderName: string;
  cashBalance: Usd;
  strategy: string;
  riskProfile: RiskProfile;
  createdAt: string;
}

/** One equity position held in an account. */
export interface Holding {
  id: string;
  accountId: string;
  ticker: Ticker;
  shares: number;
  avgCost: Usd;
  openedAt: string;
}

/** A completed trade record (immutable once written). */
export interface Trade {
  id: string;
  accountId: string;
  ticker: Ticker;
  side: TradeSide;
  shares: number;
  price: Usd;
  totalValue: Usd;
  rationale: string;
  executedAt: string;
}

/** Net-worth snapshot used for the equity curve / history. */
export interface AccountSnapshot {
  accountId: string;
  timestamp: string;
  cash: Usd;
  holdingsValue: Usd;
  netWorth: Usd;
}
