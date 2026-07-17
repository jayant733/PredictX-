import type { Account, Holding, Trade } from "@autonomous-traders/shared";

/**
 * Row mappers: convert raw SQLite rows (snake_case columns) into the
 * camelCase domain types defined in @autonomous-traders/shared.
 * `any` is deliberate here — these are the single boundary where we
 * trust the column names from our own schema.
 */

export function rowToAccount(r: any): Account {
  return {
    id: r.id,
    traderName: r.trader_name,
    cashBalance: r.cash_balance,
    strategy: r.strategy,
    riskProfile: r.risk_profile,
    createdAt: r.created_at,
  };
}

export function rowToHolding(r: any): Holding {
  return {
    id: r.id,
    accountId: r.account_id,
    ticker: r.ticker,
    shares: r.shares,
    avgCost: r.avg_cost,
    openedAt: r.opened_at,
  };
}

export function rowToTrade(r: any): Trade {
  return {
    id: r.id,
    accountId: r.account_id,
    ticker: r.ticker,
    side: r.side,
    shares: r.shares,
    price: r.price,
    totalValue: r.total_value,
    rationale: r.rationale,
    executedAt: r.executed_at,
  };
}
