/**
 * seed-ai.ts — Generates RAG (Retrieval-Augmented Generation) embeddings
 * and AI market insights for all LIVE markets already in the database.
 *
 * Prerequisite: The database must have markets (fetched via POST /api/markets/sync).
 * This script should be run AFTER syncing live Polymarket data.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { markets, documentChunks, marketInsights } from "./schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: any, init: any) {
  const options = init || {};
  options.tls = options.tls || {};
  options.tls.rejectUnauthorized = false;
  return originalFetch(input, options);
} as any;

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const IS_MOCK_MODE = !GEMINI_API_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// Embedding helper using Gemini text-embedding-004
async function generateEmbedding(text: string): Promise<number[]> {
  if (IS_MOCK_MODE) {
    // Deterministic mock embedding so idempotent runs produce same vectors
    const hash = Array.from(text).reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
    const vector = Array.from({ length: 768 }, (_, i) => Math.sin((hash + i) * 0.01));
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / (magnitude || 1));
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
      })
    });
    if (!response.ok) throw new Error(`Gemini Embedding error: ${response.status}`);
    const data = await response.json() as any;
    return data.embedding.values;
  } catch (err) {
    console.warn("Embedding generation failed, using fallback vector:", err);
    const vector = Array.from({ length: 768 }, (_, i) => Math.cos(i * 0.1));
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
}

// Use Gemini to generate AI insight from the live market question
async function generateInsight(question: string, description: string): Promise<{
  summary: string;
  sentimentScore: number;
  recommendation: string;
}> {
  if (IS_MOCK_MODE || !GEMINI_API_KEY) {
    return {
      summary: `Auto-generated insight for market: "${question}". Probability analysis pending live data feed.`,
      sentimentScore: 50,
      recommendation: "HOLD"
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `You are a prediction market analyst. Analyze this market question and provide a concise insight.

Market Question: "${question}"
Description: "${description}"

Respond with valid JSON only:
{
  "summary": "2-3 sentence analysis of key factors driving probability",
  "sentimentScore": <integer 1-100 representing bullish probability for YES>,
  "recommendation": "BUY YES" | "BUY NO" | "HOLD"
}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text.trim());
  } catch (err) {
    console.warn(`Insight generation failed for "${question}":`, err);
    return {
      summary: `Market analysis for "${question}": Live prediction market with active trading. Monitor price movements for entry signals.`,
      sentimentScore: 50,
      recommendation: "HOLD"
    };
  }
}

async function seedAI() {
  console.log("🤖 Seeding AI & RAG Data for LIVE markets...");

  const allMarkets = await db.select().from(markets);
  if (allMarkets.length === 0) {
    console.error("❌ No markets found. Sync live markets first: POST /api/markets/sync");
    process.exit(1);
  }

  console.log(`Found ${allMarkets.length} live markets. Processing...`);

  for (const m of allMarkets) {
    const question = m.question;
    const description = m.description || question;

    // Skip if already seeded
    const existingChunks = await db.select().from(documentChunks)
      .where(eq(documentChunks.marketId, m.id)).limit(1);
    if (existingChunks.length > 0) {
      console.log(`⏩ Skipping (already seeded): "${question.slice(0, 60)}..."`);
      continue;
    }

    console.log(`🔍 Processing: "${question.slice(0, 60)}..."`);

    // Generate embedding for the market question itself
    const embedding = await generateEmbedding(`${question}\n\n${description}`);
    
    await db.insert(documentChunks).values({
      marketId: m.id,
      sourceUrl: `https://polymarket.com/event/${m.id}`,
      title: question,
      content: description,
      embedding
    });

    // Generate AI insight
    const insight = await generateInsight(question, description);

    const existingInsight = await db.select().from(marketInsights)
      .where(eq(marketInsights.marketId, m.id)).limit(1);
    
    if (existingInsight.length === 0) {
      await db.insert(marketInsights).values({
        marketId: m.id,
        sentimentScore: insight.sentimentScore,
        summary: insight.summary,
        recommendation: insight.recommendation
      });
    }

    console.log(`✅ Seeded AI insight for: "${question.slice(0, 60)}..." | Sentiment: ${insight.sentimentScore} | Rec: ${insight.recommendation}`);
  }

  console.log("🎉 AI Seed complete!");
  process.exit(0);
}

seedAI().catch(err => {
  console.error("AI Seed failed:", err);
  process.exit(1);
});
