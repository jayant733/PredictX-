import { pgTable, uuid, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'DEPOSIT', 'WITHDRAWAL', 'SPLIT', 'MERGE', 'TRADE_BUY', 'TRADE_SELL'
  amountUsd: integer("amount_usd").notNull(), // Value in cents (can be negative for withdrawals/buys)
  details: jsonb("details"), // Structured details of splits, merges, or trades
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
