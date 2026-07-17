import { pgTable, uuid, varchar, timestamp, index, customType, text } from "drizzle-orm/pg-core";
import { markets } from "./markets";

// Custom type for pgvector (dimension-less to bypass Drizzle Kit regtype check bug)
export const pgVector = customType<{ data: number[] }>({
  dataType() {
    return "vector"; 
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      return value.replace(/[\[\]]/g, "").split(",").map(Number);
    }
    return value as number[];
  }
});

// 9. Document Chunks Table for RAG
export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  embedding: pgVector("embedding").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    marketIdIdx: index("document_chunks_market_id_idx").on(table.marketId),
  };
});
