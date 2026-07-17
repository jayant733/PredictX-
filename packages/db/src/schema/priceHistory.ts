import { pgTable, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { markets } from "./markets";

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id").references(() => markets.id).notNull(),
  yesPrice: integer("yes_price").notNull(),
  noPrice: integer("no_price").notNull(),
  volumeUsd: integer("volume_usd").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    marketTimestampIdx: index("price_history_market_timestamp_idx").on(table.marketId, table.timestamp),
  };
});
