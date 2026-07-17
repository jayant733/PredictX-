import { pgTable, uuid, varchar, timestamp, index, text } from "drizzle-orm/pg-core";
import { markets } from "./markets";
import { users } from "./users";

// 11. Fraud Alerts Table
export const fraudAlerts = pgTable("fraud_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'WASH_TRADING', 'PRICE_MANIPULATION', 'UNUSUAL_VOLUME'
  severity: varchar("severity", { length: 20 }).notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // 'ACTIVE', 'RESOLVED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index("fraud_alerts_status_idx").on(table.status),
  };
});
