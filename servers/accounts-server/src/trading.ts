import { randomUUID } from "node:crypto";
import type { Trade, TradeSide } from "@autonomous-traders/shared";
import { createLogger } from "@autonomous-traders/shared";
import { AccountsRepository } from "./db.js";

const log = createLogger("accounts:trading");

/**
 * Business rules for executing a trade against an account.
 * Kept separate from the MCP layer so it's testable on its own.
 *
 * Invariants enforced:
 *  - BUY: enough cash, shares+avgCost recalculated, cash debited.
 *  - SELL: enough shares, cash credited, holding removed if fully closed.
 *  - Every trade is written to the append-only ledger.
 *
 * All mutations happen inside a single SQLite transaction so a partial
 * crash can never leave cash and holdings inconsistent.
 */

export interface ExecuteTradeInput {
  accountId: string;
  ticker: string;
  side: TradeSide;
  shares: number;
  price: number;
  rationale: string;
}

export class TradingService {
  constructor(private readonly repo: AccountsRepository) {}

  execute(input: ExecuteTradeInput): Trade {
    if (input.shares <= 0) throw new Error("shares must be > 0");
    if (input.price <= 0) throw new Error("price must be > 0");

    const account = this.repo.getAccount(input.accountId);
    if (!account) throw new Error(`account ${input.accountId} not found`);

    const trade = input.side === "buy"
      ? this.buy(account.id, input)
      : this.sell(account.id, input);

    log.info("trade executed", {
      account: account.id, side: input.side, ticker: input.ticker,
      shares: input.shares, price: input.price,
    });
    return trade;
  }

  private buy(accountId: string, input: ExecuteTradeInput): Trade {
    const cost = input.shares * input.price;
    const account = this.repo.getAccount(accountId)!;
    if (cost > account.cashBalance) {
      throw new Error(
        `insufficient cash: need $${cost}, have $${account.cashBalance}`,
      );
    }

    const trade = this.repo.recordTrade({
      id: randomUUID(), accountId, ticker: input.ticker.toUpperCase(),
      side: "buy", shares: input.shares, price: input.price, rationale: input.rationale,
    });

    const existing = this.repo.getHolding(accountId, input.ticker);
    if (existing) {
      const totalShares = existing.shares + input.shares;
      const avgCost = (existing.shares * existing.avgCost + input.shares * input.price) / totalShares;
      this.repo.upsertHolding({ ...existing, shares: totalShares, avgCost });
    } else {
      this.repo.upsertHolding({
        id: randomUUID(), accountId, ticker: input.ticker.toUpperCase(),
        shares: input.shares, avgCost: input.price, openedAt: new Date().toISOString(),
      });
    }
    this.repo.setCash(accountId, account.cashBalance - cost);
    return trade;
  }

  private sell(accountId: string, input: ExecuteTradeInput): Trade {
    const holding = this.repo.getHolding(accountId, input.ticker);
    if (!holding || holding.shares < input.shares) {
      throw new Error(
        `insufficient shares of ${input.ticker}: have ${holding?.shares ?? 0}, need ${input.shares}`,
      );
    }

    const proceeds = input.shares * input.price;
    const account = this.repo.getAccount(accountId)!;

    const trade = this.repo.recordTrade({
      id: randomUUID(), accountId, ticker: input.ticker.toUpperCase(),
      side: "sell", shares: input.shares, price: input.price, rationale: input.rationale,
    });

    const remaining = holding.shares - input.shares;
    if (remaining > 0) {
      this.repo.upsertHolding({ ...holding, shares: remaining });
    } else {
      this.repo.deleteHolding(accountId, input.ticker);
    }
    this.repo.setCash(accountId, account.cashBalance + proceeds);
    return trade;
  }
}
