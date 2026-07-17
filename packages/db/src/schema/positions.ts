import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { markets } from "./markets";

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  marketId: uuid("market_id").references(() => markets.id).notNull(),
  outcome: varchar("outcome", { length: 10 }).notNull(), // 'YES', 'NO'
  quantity: integer("quantity").notNull(), // Number of shares held
  averageBuyPrice: integer("average_buy_price").notNull(), // Average price in cents
  status: varchar("status", { length: 20 }).default("OPEN").notNull(), // 'OPEN', 'PARTIALLY_CLOSED', 'CLOSED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userMarketOutcomeUnique: uniqueIndex("user_market_outcome_unique").on(table.userId, table.marketId, table.outcome),
  };
});
