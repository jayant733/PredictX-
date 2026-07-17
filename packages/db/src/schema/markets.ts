import { pgTable, uuid, varchar, integer, bigint, text, timestamp, index } from "drizzle-orm/pg-core";

export const markets = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  polymarketId: varchar("polymarket_id", { length: 100 }).unique(),           // Polymarket market conditionId for idempotent sync
  question: text("question").notNull(),                                        // Full market question text (no length limit)
  category: varchar("category", { length: 100 }).notNull(),                   // e.g., 'Crypto', 'Politics', 'Sports' (expanded from 50)
  description: text("description"),                                            // Full description (no length limit)
  status: varchar("status", { length: 20 }).default("OPEN").notNull(),        // 'OPEN', 'CLOSED', 'RESOLVED'
  resolutionOutcome: varchar("resolution_outcome", { length: 10 }),           // 'YES', 'NO', 'CANCELLED'
  yesPrice: integer("yes_price").default(50).notNull(),                       // Price of YES in cents (1-99)
  noPrice: integer("no_price").default(50).notNull(),                         // Price of NO in cents (1-99)
  volumeUsd: bigint("volume_usd", { mode: "number" }).default(0).notNull(),   // Total volume in cents; bigint for high-volume Polymarket markets
  endTime: timestamp("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    categoryIdx: index("markets_category_idx").on(table.category),
    statusIdx: index("markets_status_idx").on(table.status),
    polymarketIdx: index("markets_polymarket_id_idx").on(table.polymarketId),
  };
});
