import { db, isDbConnected } from "../db";
import { markets, users, transactions } from "@nexus/db";
import { eq, and } from "drizzle-orm";
import { placeLimitOrder, validatePreTrade } from "@nexus/orderbook";

export let serverInstance: any = null;

export function setServerInstance(server: any) {
  serverInstance = server;
}

const NEWS_TEMPLATES = [
  { keywords: ["recession", "gdp"], headline: "Economic Alert: High inflation triggers recession fears.", priceShift: -3, target: "recession" },
  { keywords: ["recession", "gdp"], headline: "Markets Rally: US economic resilience cools off recession chatter.", priceShift: 4, target: "recession" },
  { keywords: ["bitcoin", "btc"], headline: "Crypto News: SEC hints at new spot Bitcoin integrations.", priceShift: 3, target: "btc" },
  { keywords: ["bitcoin", "btc"], headline: "Crypto Alert: Wholesale mining blocks encounter hardware bottlenecks.", priceShift: -2, target: "btc" },
  { keywords: ["champions", "madrid", "ucl"], headline: "UEFA Update: Real Madrid roster declared fully fit for final.", priceShift: 3, target: "ucl" },
  { keywords: ["champions", "madrid", "ucl"], headline: "Sports Rumor: Top striker reports injury ahead of UCL match.", priceShift: -4, target: "ucl" },
];

const RETAIL_WALLETS = [
  "RetailTrader1111111111111111111111111111111111",
  "RetailTrader2222222222222222222222222222222222",
  "RetailTrader3333333333333333333333333333333333",
];

import { Keypair } from "@solana/web3.js";
import { encrypt } from "../crypto";
import { ENCRYPTION_SECRET } from "../db";

async function ensureRetailUsers() {
  if (!isDbConnected) return [];
  const retailUserIds: string[] = [];
  for (let i = 0; i < RETAIL_WALLETS.length; i++) {
    const wallet = RETAIL_WALLETS[i];
    let [user] = await db.select().from(users).where(eq(users.wallet, wallet)).limit(1);
    if (!user) {
      const depositKeypair = Keypair.generate();
      const depositAddress = depositKeypair.publicKey.toString();
      const encryptedPrivateKey = encrypt(Buffer.from(depositKeypair.secretKey).toString("hex"), ENCRYPTION_SECRET);

      [user] = await db.insert(users).values({
        wallet,
        balanceUsd: 10000000,
        depositAddress,
        depositPrivateKeyEncrypted: encryptedPrivateKey
      }).returning();
    }
    retailUserIds.push(user.id);
  }
  return retailUserIds;
}

export function startMicrostructureEngine() {
  if (!isDbConnected) return;

  setInterval(async () => {
    try {
      const retailUserIds = await ensureRetailUsers();
      if (retailUserIds.length === 0) return;

      const activeMarkets = await db.select().from(markets).where(eq(markets.status, "OPEN"));
      if (activeMarkets.length === 0) return;

      // 1. News-driven volatility simulation
      if (Math.random() < 0.15) {
        const news = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
        const targetMarket = activeMarkets.find(m => 
          news.keywords.some(kw => m.question.toLowerCase().includes(kw))
        );

        if (targetMarket) {
          const newYesPrice = Math.max(5, Math.min(95, targetMarket.yesPrice + news.priceShift));
          const newNoPrice = 100 - newYesPrice;

          await db.update(markets).set({
            yesPrice: newYesPrice,
            noPrice: newNoPrice,
            volumeUsd: targetMarket.volumeUsd + 2000
          }).where(eq(markets.id, targetMarket.id));

          if (serverInstance) {
            serverInstance.publish("price-updates", JSON.stringify({
              type: "PRICE_UPDATE",
              marketId: targetMarket.id,
              yesPrice: newYesPrice,
              noPrice: newNoPrice,
              volumeUsd: targetMarket.volumeUsd + 2000,
              newsHeadline: news.headline
            }));
          }
        }
      }

      // 2. Simulated retail participant trading
      if (Math.random() < 0.40) {
        const market = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
        const simulatedUser = retailUserIds[Math.floor(Math.random() * retailUserIds.length)];

        const action = Math.random() < 0.5 ? "BUY" : "SELL";
        const outcome = Math.random() < 0.5 ? "YES" : "NO";
        const quantity = Math.floor(Math.random() * 8) + 2;
        
        const currentPrice = outcome === "YES" ? market.yesPrice : market.noPrice;
        const priceOffset = Math.random() < 0.5 ? -1 : 1;
        const targetPrice = Math.max(5, Math.min(95, currentPrice + priceOffset));

        await db.transaction(async (tx) => {
          const validation = await validatePreTrade(tx, simulatedUser, market.id, {
            action,
            outcome,
            price: targetPrice,
            quantity
          });

          if (validation.status === "VALID") {
            await placeLimitOrder(tx, simulatedUser, market.id, outcome, action, targetPrice, validation.adjustedQuantity);
          }
        });

        const [updatedMarket] = await db.select().from(markets).where(eq(markets.id, market.id)).limit(1);
        if (updatedMarket && serverInstance) {
          serverInstance.publish("price-updates", JSON.stringify({
            type: "PRICE_UPDATE",
            marketId: market.id,
            yesPrice: updatedMarket.yesPrice,
            noPrice: updatedMarket.noPrice,
            volumeUsd: updatedMarket.volumeUsd
          }));
        }
      }
    } catch (e) {
      console.error("Microstructure cycle error:", e);
    }
  }, 5000);
}
