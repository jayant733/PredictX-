import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex, text } from "drizzle-orm/pg-core";
import { markets } from "./markets";

// 10. Market Insights Table for pre-computed LLM recommendations/sentiment
export const marketInsights = pgTable("market_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }).notNull().unique(),
  sentimentScore: integer("sentiment_score").default(50).notNull(), // 0 to 100 representing probability of YES (sentiment-wise)
  summary: text("summary").notNull(), // Short markdown overview of key news / why odds are shifting
  recommendation: varchar("recommendation", { length: 50 }).default("HOLD").notNull(), // 'BUY YES', 'BUY NO', 'HOLD'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    marketIdUniqueIdx: uniqueIndex("market_insights_market_id_unique_idx").on(table.marketId),
  };
});
