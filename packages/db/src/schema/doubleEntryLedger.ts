import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const doubleEntryLedger = pgTable("double_entry_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  botId: varchar("bot_id", { length: 50 }).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'ALLOCATION_TRANSFER', 'TRADE_DEBIT', 'TRADE_CREDIT', 'REFUND'
  debitCents: integer("debit_cents").default(0).notNull(),  // Money coming in
  creditCents: integer("credit_cents").default(0).notNull(), // Money going out
  marketId: uuid("market_id"),
  orderId: uuid("order_id"),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
