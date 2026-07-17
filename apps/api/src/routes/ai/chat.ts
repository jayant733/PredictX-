import { eq, and, sql } from "drizzle-orm";
import { db, isDbConnected } from "../../db";
import { markets, orders, documentChunks } from "@nexus/db";
import { generateEmbedding, chatSessionStream } from "../../ai/gemini";
import { jsonRes } from "../../utils/response";

export async function handlePostAiChat(req: Request, session: any) {
  const { marketId, messages, userMessage } = await req.json();
  if (!marketId || !userMessage) return jsonRes({ error: "Missing marketId or userMessage" }, 400);

  let marketQuestion = "Mock Market";
  let marketDescription = "";
  let orderbookText = "No live orderbook available.";
  let relatedChunks: string[] = [];

  if (isDbConnected) {
    const marketRows = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
    if (marketRows.length > 0) {
      marketQuestion = marketRows[0].question;
      marketDescription = marketRows[0].description || "";
    }

    const pendingOrders = await db.select().from(orders).where(and(eq(orders.marketId, marketId), eq(orders.status, "PENDING")));
    let yesBids = 0, yesAsks = 0, noBids = 0, noAsks = 0;
    for (const o of pendingOrders) {
      if (o.outcome === "YES") {
        if (o.side === "BUY") yesBids += o.remainingQuantity; else yesAsks += o.remainingQuantity;
      } else {
        if (o.side === "BUY") noBids += o.remainingQuantity; else noAsks += o.remainingQuantity;
      }
    }
    orderbookText = `YES Bids Depth: ${yesBids} shares, YES Asks Depth: ${yesAsks} shares. NO Bids Depth: ${noBids} shares, NO Asks Depth: ${noAsks} shares.`;

    try {
      const queryEmbedding = await generateEmbedding(userMessage);
      const chunks = await db.select({ content: documentChunks.content }).from(documentChunks)
        .where(eq(documentChunks.marketId, marketId))
        .orderBy(sql`${documentChunks.embedding} <=> ${`[${queryEmbedding.join(",")}]`}`)
        .limit(3);
      relatedChunks = chunks.map(c => c.content);
    } catch (e) {
      console.error("Vector retrieval failed:", e);
    }
  }

  const stream = await chatSessionStream(marketQuestion, marketDescription, orderbookText, messages || [], userMessage, relatedChunks);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
