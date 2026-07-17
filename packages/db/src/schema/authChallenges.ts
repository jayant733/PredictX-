import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const authChallenges = pgTable("auth_challenges", {
  publicKey: varchar("public_key", { length: 44 }).primaryKey(),
  nonce: varchar("nonce", { length: 36 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
