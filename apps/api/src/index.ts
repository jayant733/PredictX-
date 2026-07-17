// Patch global fetch to bypass TLS certificate validation globally for Bun
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: any, init: any) {
  const options = init || {};
  options.tls = options.tls || {};
  options.tls.rejectUnauthorized = false;
  return originalFetch(input, options);
} as any;

import { checkDbConnection, PORT } from "./db";
import { authenticate, optionalAuthenticate } from "./middleware/auth";
import { handleAuthChallenge, handleAuthVerify, handleAuthDemo } from "./routes/auth";
import { handleGetMarkets, handleGetMarketDetail, handleGetOrderbook, handleGetCharts, handleSyncPolymarket, handleCreateManualMarket, handleResolveManualMarket } from "./routes/markets";
import { handleGetBalance, handleGetPositions, handleGetHistory, handleTrade, handleSplit, handleMerge } from "./routes/trading";
import { handleGetAiInsights, handleGetAiRecommend, handlePostAiChat, handlePostAiPortfolioAnalyze, handlePostAiMarketGenerate, handlePostAiMarketIntelligence, handleGetAiTraders, handlePostAiTradersCycle, handleGetAiTradersSettings, handlePostAiTradersSettings, handlePostStopAllAiTraders, handleGetAiTradersLedger, handleGetAiTradersAnalytics } from "./routes/aiRoutes";
import { handleGetFraudAlerts } from "./routes/fraud";
import { jsonRes } from "./utils/response";
import { setServerInstance, startMicrostructureEngine } from "./services/microstructure";

// Initialize DB connection check
await checkDbConnection();

const server = Bun.serve({
  port: PORT,
  async fetch(req, serverInstance) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/api/ws") {
      const upgraded = serverInstance.upgrade(req);
      if (upgraded) return;
      return new Response("Upgrade failed", { status: 400 });
    }

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // 1. PUBLIC READ ROUTES
      if (url.pathname === "/api/markets" && method === "GET") return await handleGetMarkets(url);
      if (url.pathname === "/api/market" && method === "GET") return await handleGetMarketDetail(url);
      
      const marketsMatch = url.pathname.match(/^\/api\/markets\/([a-f0-9-]+)$/);
      if (marketsMatch && method === "GET") {
        const id = marketsMatch[1];
        const newUrl = new URL(url.toString());
        newUrl.searchParams.set("id", id);
        return await handleGetMarketDetail(newUrl);
      }

      if (url.pathname === "/api/orderbook" && method === "GET") return await handleGetOrderbook(url);
      if (url.pathname === "/api/charts" && method === "GET") return await handleGetCharts(url);
      if (url.pathname === "/api/auth/challenge" && method === "GET") return await handleAuthChallenge(url);
      if (url.pathname === "/api/auth/verify" && method === "POST") return await handleAuthVerify(req);
      if (url.pathname === "/api/auth/demo" && method === "POST") return await handleAuthDemo();
      if (url.pathname === "/api/ai/insights" && method === "GET") return await handleGetAiInsights(url);
      if (url.pathname === "/api/ai/recommend" && method === "GET") return await handleGetAiRecommend(url);
      if (url.pathname === "/api/markets/sync" && method === "POST") return await handleSyncPolymarket(req);
      if (url.pathname === "/api/ai/traders" && method === "GET") {
        const session = await optionalAuthenticate(req);
        return await handleGetAiTraders(req, session);
      }

      // 2. AUTHENTICATED ROUTES
      const session = await authenticate(req);
      
      if (url.pathname === "/api/markets/create-manual" && method === "POST") return await handleCreateManualMarket(req);
      if (url.pathname === "/api/markets/resolve-manual" && method === "POST") return await handleResolveManualMarket(req);
      if (url.pathname === "/api/balance" && method === "GET") return await handleGetBalance(session);
      if (url.pathname === "/api/positions" && method === "GET") return await handleGetPositions(session);
      if (url.pathname === "/api/history" && method === "GET") return await handleGetHistory(session);
      if (url.pathname === "/api/buy" && method === "POST") return await handleTrade(req, session, "BUY");
      if (url.pathname === "/api/sell" && method === "POST") return await handleTrade(req, session, "SELL");
      if (url.pathname === "/api/split" && method === "POST") return await handleSplit(req, session);
      if (url.pathname === "/api/merge" && method === "POST") return await handleMerge(req, session);
      if (url.pathname === "/api/ai/chat" && method === "POST") return await handlePostAiChat(req, session);
      if (url.pathname === "/api/ai/portfolio/analyze" && method === "POST") return await handlePostAiPortfolioAnalyze(req, session);
      if (url.pathname === "/api/ai/market/generate" && method === "POST") return await handlePostAiMarketGenerate(req, session);
      if (url.pathname === "/api/fraud/alerts" && method === "GET") return await handleGetFraudAlerts(session);
      if (url.pathname === "/api/ai/intelligence" && method === "POST") return await handlePostAiMarketIntelligence(req, session);
      if (url.pathname === "/api/ai/traders/cycle" && method === "POST") return await handlePostAiTradersCycle(req);
      if (url.pathname === "/api/ai/traders/settings" && method === "GET") return await handleGetAiTradersSettings(req, session);
      if (url.pathname === "/api/ai/traders/settings" && method === "POST") return await handlePostAiTradersSettings(req, session);
      if (url.pathname === "/api/ai/traders/stop-all" && method === "POST") return await handlePostStopAllAiTraders(req, session);
      if (url.pathname === "/api/ai/traders/ledger" && method === "GET") return await handleGetAiTradersLedger(req, session);
      if (url.pathname === "/api/ai/traders/analytics" && method === "GET") return await handleGetAiTradersAnalytics(req, session);

      return jsonRes({ error: "Not Found" }, 404);
    } catch (err) {
      console.error(err);
      return jsonRes({ error: (err as Error).message }, 500);
    }
  },
  websocket: {
    open(ws) {
      ws.subscribe("price-updates");
    },
    message(ws, msg) {},
    close(ws) {}
  }
});

console.log(`🚀 API Server running at http://localhost:${PORT}`);

// Initialize Microstructure Broadcast & Simulation engine
setServerInstance(server);
startMicrostructureEngine();

// Background Auto-Trading Engine
setInterval(async () => {
  try {
    const mockReq = new Request("http://localhost/api/ai/traders/cycle", {
      method: "POST",
      body: JSON.stringify({})
    });
    await handlePostAiTradersCycle(mockReq);
  } catch (err) {
    console.error("Auto-Trading Background Cycle error:", err);
  }
}, 4000);
