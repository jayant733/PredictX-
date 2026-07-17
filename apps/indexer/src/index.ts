import { Connection } from "@solana/web3.js";
import { sql } from "drizzle-orm";
import { getDb, users } from "@nexus/db";
import { checkDepositAddress } from "./indexer/polling";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/nexus";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "10000");
const SOL_PRICE_USD_CENTS = parseInt(process.env.SOL_PRICE_USD_CENTS || "15000");

const db = getDb(DATABASE_URL);
let connection: Connection | null = null;

try {
  connection = new Connection(SOLANA_RPC_URL, "confirmed");
  console.log(`🔌 Connected to Solana RPC at ${SOLANA_RPC_URL}`);
} catch (err) {
  console.warn("⚠️ Failed to connect to Solana RPC, running indexer in simulation mode.", (err as Error).message);
}

let isDbConnected = false;

async function checkDb() {
  try {
    const connectionCheck = db.execute(sql`SELECT 1`);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
    await Promise.race([connectionCheck, timeout]);
    isDbConnected = true;
    console.log("✅ Database connected successfully in indexer!");
  } catch (err) {
    console.warn("⚠️ Database connection failed. Indexer running in simulation mode.", (err as Error).message);
  }
}

async function indexerTick() {
  if (!isDbConnected) return;
  try {
    const allUsers = await db.select({ id: users.id, depositAddress: users.depositAddress }).from(users);
    for (const user of allUsers) {
      await checkDepositAddress(db, connection, SOL_PRICE_USD_CENTS, user.id, user.depositAddress);
    }
  } catch (err) {
    console.error("Indexer iteration failed:", err);
  }
}

async function start() {
  console.log("🏁 Starting Solana deposit indexer daemon...");
  await checkDb();
  await indexerTick();
  
  setInterval(async () => {
    await indexerTick();
  }, POLL_INTERVAL_MS);
}

start().catch(err => {
  console.error("Fatal indexer error:", err);
  process.exit(1);
});
