import { sql } from "drizzle-orm";
import { getDb } from "@nexus/db";
export const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/nexus";
export const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "local-dev-encryption-key-for-deposit-wallets";
export const JWT_SECRET = process.env.JWT_SECRET || "super-secret-supabase-jwt-key-minimum-32-chars-long";
export const PORT = parseInt(process.env.PORT || "3001");

export const db = getDb(DATABASE_URL);

export let isDbConnected = false;

export async function checkDbConnection() {
  try {
    const connectionCheck = db.execute(sql`SELECT 1`);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
    await Promise.race([connectionCheck, timeout]);
    isDbConnected = true;
    console.log("✅ Database connected successfully!");
  } catch (err) {
    isDbConnected = false;
    console.warn("⚠️ Database connection failed. Backend is running in mock mode.", (err as Error).message);
  }
}
