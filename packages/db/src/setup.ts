import { execSync } from "child_process";
import path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function run() {
  console.log("Starting automated database setup...");
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set in environment variables.");
    process.exit(1);
  }

  try {
    // 1. Enable pgvector extension
    console.log("Enabling pgvector extension in Postgres...");
    const sql = postgres(DATABASE_URL, { max: 1 });
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    await sql.end();
    console.log("pgvector extension enabled successfully.");

    // 2. Push schema to database
    console.log("Pushing schema to database...");
    execSync("bun run db:push", {
      stdio: "inherit",
      env: { ...process.env, DOTENV_CONFIG_PATH: path.resolve(__dirname, "../../../.env") }
    });

    console.log("✅ Database schema setup complete! Live Polymarket data will be loaded at runtime.");
    console.log("   Run 'POST /api/markets/sync' to pull live markets from Polymarket.");

  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

run();
