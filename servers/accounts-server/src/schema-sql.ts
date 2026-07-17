import type { TradeSide } from "@autonomous-traders/shared";

/**
 * SQL DDL for the accounts ledger + the input types used by the repository.
 * Split out of db.ts so db.ts stays focused on query logic only.
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id            TEXT PRIMARY KEY,
  trader_name   TEXT NOT NULL,
  cash_balance  REAL NOT NULL,
  strategy      TEXT NOT NULL,
  risk_profile  TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS holdings (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL,
  ticker       TEXT NOT NULL,
  shares       REAL NOT NULL,
  avg_cost     REAL NOT NULL,
  opened_at    TEXT NOT NULL,
  UNIQUE (account_id, ticker)
);

CREATE TABLE IF NOT EXISTS trades (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL,
  ticker        TEXT NOT NULL,
  side          TEXT NOT NULL,
  shares        REAL NOT NULL,
  price         REAL NOT NULL,
  total_value   REAL NOT NULL,
  rationale     TEXT NOT NULL,
  executed_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holdings_account ON holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_account   ON trades(account_id);
`;

export interface OpenAccountInput {
  id: string;
  traderName: string;
  cashBalance: number;
  strategy: string;
  riskProfile: "conservative" | "balanced" | "aggressive";
}

export interface RecordTradeInput {
  id: string;
  accountId: string;
  ticker: string;
  side: TradeSide;
  shares: number;
  price: number;
  rationale: string;
}
