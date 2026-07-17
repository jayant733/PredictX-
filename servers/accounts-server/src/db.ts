import Database from "better-sqlite3";
import type { Database as Db } from "better-sqlite3";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import type { Account, Holding, Trade } from "@autonomous-traders/shared";
import { createLogger } from "@autonomous-traders/shared";
import { rowToAccount, rowToHolding, rowToTrade } from "./rows.js";
import { SCHEMA_SQL, type OpenAccountInput, type RecordTradeInput } from "./schema-sql.js";

const log = createLogger("accounts:db");

/**
 * SQLite-backed ledger. Schema is created idempotently on first run.
 * - `accounts`  : one row per trader (cash + strategy metadata)
 * - `holdings`  : current open positions (mutated on each trade)
 * - `trades`    : append-only ledger (never edited → full audit trail)
 *
 * The DB file lives under data/ (gitignored) so each machine has its own.
 */

export type { OpenAccountInput, RecordTradeInput };

export class AccountsRepository {
  private readonly db: Db;

  constructor(dbPath?: string) {
    const path = dbPath ?? resolve(process.cwd(), "data", "accounts.db");
    mkdirSync(resolve(path, ".."), { recursive: true });
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA_SQL);
    log.info("ledger ready", { path });
  }

  openAccount(input: OpenAccountInput): Account {
    this.db
      .prepare(
        `INSERT INTO accounts (id, trader_name, cash_balance, strategy, risk_profile, created_at)
         VALUES (@id, @traderName, @cashBalance, @strategy, @riskProfile, @createdAt)`,
      )
      .run({ ...input, createdAt: new Date().toISOString() });
    return this.getAccount(input.id)!;
  }

  getAccount(id: string): Account | undefined {
    const r = this.db
      .prepare(`SELECT * FROM accounts WHERE id = ?`)
      .get(id) as any;
    return r ? rowToAccount(r) : undefined;
  }

  listAccounts(): Account[] {
    return (this.db.prepare(`SELECT * FROM accounts`).all() as any[]).map(rowToAccount);
  }

  setCash(id: string, cash: number): void {
    this.db.prepare(`UPDATE accounts SET cash_balance = ? WHERE id = ?`).run(cash, id);
  }

  getHolding(accountId: string, ticker: string): Holding | undefined {
    const r = this.db
      .prepare(`SELECT * FROM holdings WHERE account_id = ? AND ticker = ?`)
      .get(accountId, ticker) as any;
    return r ? rowToHolding(r) : undefined;
  }

  listHoldings(accountId: string): Holding[] {
    return (this.db
      .prepare(`SELECT * FROM holdings WHERE account_id = ?`)
      .all(accountId) as any[])
      .map(rowToHolding);
  }

  upsertHolding(h: Holding): void {
    this.db
      .prepare(
        `INSERT INTO holdings (id, account_id, ticker, shares, avg_cost, opened_at)
         VALUES (@id, @accountId, @ticker, @shares, @avgCost, @openedAt)
         ON CONFLICT(account_id, ticker) DO UPDATE SET shares=@shares, avg_cost=@avgCost`,
      )
      .run(h);
  }

  deleteHolding(accountId: string, ticker: string): void {
    this.db
      .prepare(`DELETE FROM holdings WHERE account_id = ? AND ticker = ?`)
      .run(accountId, ticker);
  }

  recordTrade(t: RecordTradeInput): Trade {
    const executedAt = new Date().toISOString();
    const totalValue = t.shares * t.price;
    this.db
      .prepare(
        `INSERT INTO trades (id, account_id, ticker, side, shares, price, total_value, rationale, executed_at)
         VALUES (@id, @accountId, @ticker, @side, @shares, @price, @totalValue, @rationale, @executedAt)`,
      )
      .run({ ...t, totalValue, executedAt });
    return { ...t, totalValue, executedAt };
  }

  listTrades(accountId: string): Trade[] {
    return (this.db
      .prepare(`SELECT * FROM trades WHERE account_id = ? ORDER BY executed_at DESC`)
      .all(accountId) as any[])
      .map(rowToTrade);
  }

  close(): void {
    this.db.close();
    log.info("ledger closed");
  }
}
