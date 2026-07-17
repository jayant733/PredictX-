import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { markets, positions, orders, users } from "./packages/db/src/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("No DATABASE_URL found in environment variables.");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function sync() {
  console.log("Fetching live Polymarket questions...");
  const response = await fetch("https://gamma-api.polymarket.com/markets?active=true&limit=15&closed=false", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  });
  if (!response.ok) throw new Error("Fetch from Polymarket Gamma API failed");
  const pmMarkets = await response.json() as any[];

  // Find Market Maker
  const mmWallet = "AquKi58ctfgm1cB9b93qNXrKtm9ABEqHqeLfyYZPSkDr";
  const [marketMaker] = await db.select().from(users).where(eq(users.wallet, mmWallet)).limit(1);

  let inserted = 0;
  for (const pm of pmMarkets) {
    if (!pm.question) continue;

    const existing = await db.select().from(markets).where(eq(markets.question, pm.question)).limit(1);
    if (existing.length > 0) continue;

    const yesPriceFraction = pm.outcomePrices ? parseFloat(pm.outcomePrices[0]) : 0.5;
    const yesPrice = Math.min(99, Math.max(1, Math.round(yesPriceFraction * 100)));
    const noPrice = 100 - yesPrice;

    const category = pm.category || (pm.tags && pm.tags[0]) || "General";
    const description = pm.description || `Polymarket prediction: ${pm.question}`;
    const endTime = pm.endDate ? new Date(pm.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [newMarket] = await db.insert(markets).values({
      question: pm.question.substring(0, 255),
      category: category.substring(0, 50),
      description: description.substring(0, 999),
      yesPrice,
      noPrice,
      volumeUsd: Math.round(parseFloat(pm.volume || "0")),
      status: "OPEN",
      endTime,
    }).returning();

    inserted++;

    if (marketMaker) {
      try {
        await db.insert(positions).values([
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", quantity: 50000, averageBuyPrice: yesPrice },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", quantity: 50000, averageBuyPrice: noPrice }
        ]);

        await db.insert(orders).values([
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: Math.max(1, yesPrice - 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: Math.max(1, yesPrice - 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: Math.min(99, yesPrice + 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: Math.min(99, yesPrice + 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: Math.max(1, noPrice - 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: Math.max(1, noPrice - 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: Math.min(99, noPrice + 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
          { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: Math.min(99, noPrice + 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" }
        ]);
      } catch (e) {
        console.error("Failed to seed orderbook for new synced market:", e);
      }
    }
  }

  console.log(`Successfully synced and seeded ${inserted} new Polymarket prediction questions!`);
  process.exit(0);
}

sync().catch(e => {
  console.error(e);
  process.exit(1);
});
