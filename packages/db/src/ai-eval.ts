import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { markets, documentChunks } from "./schema";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";
import { generateEmbedding, generateMarketSummary, chatSessionStream } from "../../../apps/api/src/ai/gemini";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function runTests() {
  console.log("==============================================");
  console.log("🚀 Starting PredictX AI Evaluation Suite");
  console.log("==============================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ Passed: ${testName}`);
      passed++;
    } else {
      console.error(`❌ Failed: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Embedding Vector Size Check
    console.log("\nRunning Test 1: Embedding Vector Dimensions...");
    const testText = "How will the federal reserve respond to sticky Q1 inflation numbers?";
    const embedding = await generateEmbedding(testText);
    assert(Array.isArray(embedding), "Embedding returned an array");
    assert(embedding.length === 768, `Embedding length is 768 (got ${embedding.length})`);

    // Test 2: RAG Vector Similarity Search Integrity
    console.log("\nRunning Test 2: pgvector Cosine Distance Search...");
    const allMarkets = await db.select().from(markets).limit(1);
    if (allMarkets.length === 0) {
      console.warn("⚠️ Skipping Test 2: No markets seeded.");
    } else {
      const marketId = allMarkets[0].id;
      const queryEmbedding = await generateEmbedding("US Gross Domestic Product inflation");
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      const results = await db
        .select({
          id: documentChunks.id,
          title: documentChunks.title,
          content: documentChunks.content
        })
        .from(documentChunks)
        .where(eq(documentChunks.marketId, marketId))
        .orderBy(sql`${documentChunks.embedding} <=> ${embeddingString}`)
        .limit(2);

      assert(Array.isArray(results), "RAG search returned an array");
      assert(results.length > 0, "RAG search retrieved at least one chunk");
      if (results.length > 0) {
        console.log(`Top RAG Chunk Title: "${results[0].title}"`);
      }
    }

    // Test 3: Market Summary JSON Shape & Score Range Validation
    console.log("\nRunning Test 3: AI Market Summary and Sentiment Output Schema...");
    const mockQuestion = "Will Bitcoin exceed $100k by December?";
    const mockDesc = "Resolves to YES if BTC/USD trades above $100,000 before year end.";
    const mockContext = [
      "Bitcoin spot ETF net inflows hit $15 billion.",
      "The Bitcoin halving has reduced block rewards, decreasing liquid supply.",
      "Option traders are targeting massive call options near $100k for December expiration."
    ];

    const result = await generateMarketSummary(mockQuestion, mockDesc, mockContext);
    
    assert(typeof result.summary === "string", "Summary field is a string");
    assert(result.summary.length > 30, "Summary has non-empty reasoning contents");
    assert(typeof result.sentimentScore === "number", "SentimentScore is a number");
    assert(result.sentimentScore >= 0 && result.sentimentScore <= 100, "SentimentScore falls in range [0, 100]");
    assert(
      ["BUY YES", "BUY NO", "HOLD"].includes(result.recommendation),
      `Recommendation is valid strategy trigger: "${result.recommendation}"`
    );

    // Test 4: Typewriter Streaming Chat Output Verification
    console.log("\nRunning Test 4: Chat Streaming Token Readability...");
    const stream = await chatSessionStream(
      mockQuestion,
      mockDesc,
      "YES Bids: 15K, YES Asks: 10K, Last LTP: 75c",
      [{ role: "user", content: "Is it a good time to buy YES?" }],
      "Please summarize the main bullish triggers for YES.",
      mockContext
    );

    assert(stream instanceof ReadableStream, "Chat advisor returns a ReadableStream");
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let streamText = "";
    
    // Read first few chunks
    for (let i = 0; i < 5; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value);
    }
    reader.releaseLock();
    
    assert(streamText.length > 0, "Readable stream yields chunk tokens");
    console.log("Sample streamed output excerpt:", streamText.substring(0, 100) + "...");

  } catch (err) {
    console.error("❌ Evaluation script crashed with error:", err);
    failed++;
  } finally {
    console.log("\n==============================================");
    console.log(`📋 AI Evaluation Complete: ${passed} Passed, ${failed} Failed`);
    console.log("==============================================");
    await client.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
