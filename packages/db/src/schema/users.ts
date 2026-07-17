import { pgTable, uuid, varchar, bigint, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  wallet: varchar("wallet", { length: 100 }).notNull().unique(),          // Expanded from 44 to support longer wallet addresses
  balanceUsd: bigint("balance_usd", { mode: "number" }).default(0).notNull(), // Balance in cents ($599.00 = 59900); bigint for large institutional balances
  depositAddress: varchar("deposit_address", { length: 100 }).notNull().unique(), // Expanded from 44
  depositPrivateKeyEncrypted: varchar("deposit_private_key_encrypted"),    // Encrypted private key for deposit sweep
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
