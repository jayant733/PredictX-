import { eq } from "drizzle-orm";
import { db, isDbConnected } from "../../db";
import { markets, documentChunks, marketInsights } from "@nexus/db";
import { jsonRes } from "../../utils/response";
import { generateMarketSummary } from "../../ai/gemini";

export async function handleGetAiInsights(url: URL) {
  const marketId = url.searchParams.get("marketId");
  if (!marketId) return jsonRes({ error: "Missing marketId" }, 400);

  if (!isDbConnected) {
    return jsonRes({ sentimentScore: 78, summary: "Bitcoin is targeting $100k.", recommendation: "BUY YES", updatedAt: new Date() });
  }

  const cached = await db.select().from(marketInsights).where(eq(marketInsights.marketId, marketId)).limit(1);
  if (cached.length > 0) return jsonRes(cached[0]);

  const marketRows = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
  if (marketRows.length === 0) return jsonRes({ error: "Market not found" }, 404);
  const market = marketRows[0];

  const docs = await db.select({ content: documentChunks.content }).from(documentChunks).where(eq(documentChunks.marketId, marketId)).limit(3);
  const generated = await generateMarketSummary(market.question, market.description || "", docs.map(d => d.content));

  const [inserted] = await db.insert(marketInsights).values({
    marketId,
    sentimentScore: generated.sentimentScore,
    summary: generated.summary,
    recommendation: generated.recommendation
  }).returning();

  return jsonRes(inserted);
}

export async function handleGetAiRecommend(url: URL) {
  const marketId = url.searchParams.get("marketId");
  if (!marketId) return jsonRes({ error: "Missing marketId" }, 400);
  if (!isDbConnected) return jsonRes({ recommendation: "BUY YES", confidence: 80, rationale: "Mock recommendation." });

  const cached = await db.select().from(marketInsights).where(eq(marketInsights.marketId, marketId)).limit(1);
  if (cached.length > 0) {
    return jsonRes({ recommendation: cached[0].recommendation, sentimentScore: cached[0].sentimentScore });
  }
  return jsonRes({ recommendation: "HOLD", sentimentScore: 50 });
}
