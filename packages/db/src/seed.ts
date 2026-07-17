/**
 * reset.ts — Safely clears all data from the database.
 * 
 * This script NO LONGER seeds fake/demo markets.
 * After running this, start the API server and call:
 *   POST /api/markets/sync
 * to pull fresh live markets from Polymarket.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function reset() {
  console.log("⚠️  Truncating all database tables...");

  await db.execute(sql`
    TRUNCATE TABLE 
      double_entry_ledger,
      transactions,
      deposit_logs,
      auth_challenges,
      document_chunks,
      market_insights,
      price_history,
      orders,
      positions,
      markets,
      users,
      user_bot_settings
    RESTART IDENTITY CASCADE;
  `);

  console.log("✅ All tables cleared successfully.");
  console.log("ℹ️  Start the API server and call POST /api/markets/sync to load live Polymarket data.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
