import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userBotSettings = pgTable("user_bot_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  botId: varchar("bot_id", { length: 50 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  allocatedBalanceCents: integer("allocated_balance_cents").default(0).notNull(),
  reservedBalanceCents: integer("reserved_balance_cents").default(0).notNull(),
  realizedPnlCents: integer("realized_pnl_cents").default(0).notNull(),
  unrealizedPnlCents: integer("unrealized_pnl_cents").default(0).notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winningTrades: integer("winning_trades").default(0).notNull(),
  maxDrawdownPercent: integer("max_drawdown_percent").default(0).notNull(),
  dailyLossCents: integer("daily_loss_cents").default(0).notNull(),
  sharpeRatio: integer("sharpe_ratio").default(0).notNull(),
  exposureCents: integer("exposure_cents").default(0).notNull(),
  lastProfitSyncAt: timestamp("last_profit_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
