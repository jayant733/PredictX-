import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const depositLogs = pgTable("deposit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  solanaTxSignature: varchar("solana_tx_signature", { length: 88 }).notNull().unique(),
  amountSol: varchar("amount_sol").notNull(), // Amount in lamports or SOL (stored as string to prevent loss of precision)
  amountUsd: integer("amount_usd").notNull(), // USD value credited in cents
  status: varchar("status", { length: 20 }).default("PROCESSED").notNull(), // 'PROCESSED', 'FAILED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
