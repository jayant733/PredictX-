import { executeMarketIntelligence } from "../../../apps/api/src/ai/agents";
import { getDb } from "./index";
import { markets } from "./schema";
import * as dotenv from "dotenv";
import path from "path";
import postgres from "postgres";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// Drizzle connector helper
function drizzle(sqlClient: postgres.Sql) {
  return import("drizzle-orm/postgres-js").then(m => m.drizzle(sqlClient));
}

async function runAgentEval() {
  console.log("==============================================");
  console.log("🚀 Starting PredictX Multi-Agent Evaluation Suite");
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
    const dbInstance = await db;
    const allMarkets = await dbInstance.select().from(markets).limit(1);
    if (allMarkets.length === 0) {
      console.error("❌ No markets found. Database must be seeded first.");
      process.exit(1);
    }
    const marketId = allMarkets[0].id;

    // Trigger state graph execution
    const testQuery = "Why did BTC YES price jump from 62 to 71 today?";
    console.log(`Executing Multi-Agent Graph for query: "${testQuery}"...`);
    
    const result = await executeMarketIntelligence(marketId, testQuery);

    // Test 1: Node Execution Steps Assertion
    console.log("\nRunning Test 1: LangGraph Node Flow Verification...");
    assert(Array.isArray(result.steps), "Steps is a logged array");
    assert(result.steps.length >= 5, `Executed all 5 graph node transitions (got ${result.steps.length})`);
    
    console.log("Nodes completed in sequence:");
    result.steps.forEach((step, idx) => console.log(`  Step ${idx + 1}: ${step}`));

    // Test 2: Ingestion Nodes Data Quality Checks
    console.log("\nRunning Test 2: Sub-Agent Outputs Verification...");
    assert(!!result.newsData, "News Agent populated data");
    assert(!!result.twitterData, "Twitter Agent populated data");
    assert(!!result.cryptoData, "Crypto Agent populated data");
    assert(!!result.marketData, "Market Agent populated data");

    // Test 3: Synthesis Report Schema Validation
    console.log("\nRunning Test 3: Compiler Synthesis Assertions...");
    assert(!!result.summary, "Summary was successfully compiled");
    if (result.summary) {
      assert(
        result.summary.bullet1.includes("inflows increased") || result.summary.bullet1.includes("crossed $110k"),
        `Bullet 1 matches ETF/news catalyst: "${result.summary.bullet1}"`
      );
      assert(
        result.summary.bullet2.includes("sentiment increased") || result.summary.bullet2.includes("sentiment"),
        `Bullet 2 matches social sentiment shift: "${result.summary.bullet2}"`
      );
      assert(
        result.summary.bullet3.includes("Prediction market") || result.summary.bullet3.includes("volume"),
        `Bullet 3 matches prediction orderbook shift: "${result.summary.bullet3}"`
      );
      assert(
        result.summary.fullReport.length > 50,
        "Full markdown executive summary is generated"
      );
    }

  } catch (err) {
    console.error("❌ Multi-Agent execution test crashed:", err);
    failed++;
  } finally {
    console.log("\n==============================================");
    console.log(`📋 Multi-Agent Evaluation Complete: ${passed} Passed, ${failed} Failed`);
    console.log("==============================================");
    await client.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAgentEval();
