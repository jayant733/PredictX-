import { eq } from "drizzle-orm";
import { db, isDbConnected } from "../../db";
import { users, markets, orders, positions } from "@nexus/db";
import { mockMarkets } from "../../mockStore";
import { executeMarketIntelligence } from "../../ai/agents";
import { jsonRes } from "../../utils/response";

export async function handlePostAiMarketGenerate(req: Request, session: any) {
  const { prompt } = await req.json();
  if (!prompt) return jsonRes({ error: "Missing prompt" }, 400);

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  let parsed: any;

  if (!GEMINI_API_KEY) {
    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes("fifa") || lowercasePrompt.includes("soccer") || lowercasePrompt.includes("sports")) {
      parsed = { question: "Will India win the FIFA World Cup 2030?", category: "Sports", description: "This market resolves to YES if India wins the FIFA World Cup 2030 final match.", rules: "Based on official FIFA tournament resolution.", resolutionCriteria: "Official FIFA tournament results page." };
    } else if (lowercasePrompt.includes("crypto") || lowercasePrompt.includes("bitcoin") || lowercasePrompt.includes("btc") || lowercasePrompt.includes("sol")) {
      parsed = { question: "Will Solana exceed $500 in 2026?", category: "Crypto", description: "This market resolves to YES if SOL/USD trades above $500.00 on Binance before December 31st, 2026.", rules: "Resolved using Binance spot market data.", resolutionCriteria: "Binance API or CoinGecko history feed." };
    } else {
      parsed = { question: `Will the concept '${prompt}' occur by next year?`, category: "Politics", description: `Prediction market based on concept: "${prompt}".`, rules: "Resolution based on public news consensus.", resolutionCriteria: "Major news outlets." };
    }
  } else {
    try {
      const systemInstructions = `You are the PredictX Market Creation Agent. Output a valid JSON object: { "question": "string", "category": "Sports" | "Politics" | "Crypto", "description": "string", "rules": "string", "resolutionCriteria": "string" }`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${systemInstructions}\n\nConcept: "${prompt}"` }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      if (!response.ok) throw new Error("Gemini generate content failed");
      const data = await response.json() as any;
      parsed = JSON.parse(data.candidates[0].content.parts[0].text.trim());
    } catch (err) {
      console.error("Gemini market generation failed, falling back to mock:", err);
      parsed = { question: `Will the concept '${prompt}' occur by next year?`, category: "Politics", description: `Prediction market based on concept: "${prompt}".`, rules: "Resolution based on public news consensus.", resolutionCriteria: "Major news outlets." };
    }
  }

  const fullDescription = `${parsed.description}\n\n**Rules**:\n${parsed.rules}\n\n**Resolution**:\n${parsed.resolutionCriteria}`.substring(0, 999);

  if (!isDbConnected) {
    const newMarket = { id: "mock-gen-" + Date.now(), question: parsed.question, category: parsed.category, description: fullDescription, status: "OPEN", resolutionOutcome: null, yesPrice: 50, noPrice: 50, volumeUsd: 0, endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), createdAt: new Date() };
    mockMarkets.push(newMarket);
    return jsonRes(newMarket);
  }

  const [newMarket] = await db.insert(markets).values({ question: parsed.question, category: parsed.category, description: fullDescription, yesPrice: 50, noPrice: 50, endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "OPEN" }).returning();

  try {
    const mmWallet = "AquKi58ctfgm1cB9b93qNXrKtm9ABEqHqeLfyYZPSkDr";
    let mmUserRows = await db.select().from(users).where(eq(users.wallet, mmWallet));
    let mm = mmUserRows[0];
    if (!mm) {
      const [inserted] = await db.insert(users).values({ wallet: mmWallet, balanceUsd: 100000000, depositAddress: "FnAGPJUxbqNSpJj5k538a5bJD4EuCBYtFLHZcrTxCcTt" }).returning();
      mm = inserted;
    }
    await db.insert(positions).values([
      { userId: mm.id, marketId: newMarket.id, outcome: "YES", quantity: 50000, averageBuyPrice: 50 },
      { userId: mm.id, marketId: newMarket.id, outcome: "NO", quantity: 50000, averageBuyPrice: 50 }
    ]);
    await db.insert(orders).values([
      { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: 49, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: 48, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: 51, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: 52, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: 49, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: 48, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: 51, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
      { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: 52, quantity: 3000, remainingQuantity: 3000, status: "PENDING" }
    ]);
  } catch (e) {
    console.error("Failed to seed orderbook:", e);
  }

  return jsonRes(newMarket);
}

export async function handlePostAiMarketIntelligence(req: Request, session: any) {
  const { marketId, query } = await req.json();
  if (!marketId || !query) return jsonRes({ error: "Missing marketId or query" }, 400);
  console.log(`🧠 Launching Multi-Agent State Graph for query: "${query}"`);
  const result = await executeMarketIntelligence(marketId, query);
  return jsonRes(result);
}
