import { createLogger } from "@autonomous-traders/shared";
import { AccountsRepository } from "./db.js";
import { TradingService } from "./trading.js";
import {
  ExecuteTradeSchema, GetAccountSchema, GetPortfolioSchema,
  ListHoldingsSchema, ListTradesSchema, OpenAccountSchema,
} from "./schemas.js";

const log = createLogger("accounts:handlers");

/**
 * Tool handlers. Each receives the already-parsed Zod args and returns a
 * plain JSON-serialisable object (the MCP SDK wraps it for transport).
 *
 * Handlers are intentionally thin — all business logic lives in the
 * repository / trading service so it can be unit-tested without MCP.
 */

export interface ToolContext {
  repo: AccountsRepository;
  trading: TradingService;
}

export function createHandlers(ctx: ToolContext) {
  const { repo, trading } = ctx;

  return {
    open_account: (raw: unknown) => {
      const a = OpenAccountSchema.parse(raw);
      log.info("open_account", { id: a.id });
      return repo.openAccount(a);
    },

    get_account: (raw: unknown) => {
      const a = GetAccountSchema.parse(raw);
      const acct = repo.getAccount(a.accountId);
      if (!acct) throw new Error(`account ${a.accountId} not found`);
      return acct;
    },

    list_accounts: () => repo.listAccounts(),

    list_holdings: (raw: unknown) => {
      const a = ListHoldingsSchema.parse(raw);
      return repo.listHoldings(a.accountId);
    },

    list_trades: (raw: unknown) => {
      const a = ListTradesSchema.parse(raw);
      return repo.listTrades(a.accountId).slice(0, a.limit);
    },

    execute_trade: (raw: unknown) => {
      const a = ExecuteTradeSchema.parse(raw);
      return trading.execute({
        accountId: a.accountId, ticker: a.ticker, side: a.side,
        shares: a.shares, price: a.price, rationale: a.rationale,
      });
    },

    get_portfolio: (raw: unknown) => {
      const a = GetPortfolioSchema.parse(raw);
      const account = repo.getAccount(a.accountId);
      if (!account) throw new Error(`account ${a.accountId} not found`);
      const holdings = repo.listHoldings(a.accountId);
      const trades = repo.listTrades(a.accountId).slice(0, 5);
      return { account, holdings, recentTrades: trades };
    },
  };
}

export type AccountsToolHandlers = ReturnType<typeof createHandlers>;
