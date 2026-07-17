import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { markets } from "./markets";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  marketId: uuid("market_id").references(() => markets.id).notNull(),
  outcome: varchar("outcome", { length: 10 }).notNull(), // 'YES', 'NO'
  side: varchar("side", { length: 10 }).notNull(), // 'BUY', 'SELL'
  price: integer("price").notNull(), // Price in cents (1-99)
  quantity: integer("quantity").notNull(), // Total shares ordered
  remainingQuantity: integer("remaining_quantity").notNull(), // Shares left to fill
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // 'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    marketOutcomeIdx: index("orders_market_outcome_idx").on(table.marketId, table.outcome),
    statusIdx: index("orders_status_idx").on(table.status),
  };
});
