import { eq, and, gt, or, sql } from "drizzle-orm";
import { db, isDbConnected } from "../db";
import { markets, orders, priceHistory, positions, users, transactions } from "@nexus/db";
import { mockMarkets } from "../mockStore";
import { jsonRes } from "../utils/response";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const MARKET_MAKER_WALLET = "AquKi58ctfgm1cB9b93qNXrKtm9ABEqHqeLfyYZPSkDr";
const POLYMARKET_GAMMA_URL = "https://gamma-api.polymarket.com/markets?active=true&limit=50&closed=false";

const LOCAL_POLYMARKET_FALLBACK = [
  {
    conditionId: "0xfa4a8d11b22e11880a112233445566778899aabb",
    question: "Will France win the 2026 FIFA World Cup?",
    category: "SPORTS",
    description: "This market resolves to YES if France wins the 2026 FIFA World Cup, scheduled to conclude on July 19, 2026.",
    outcomePrices: ["0.38", "0.62"],
    volume: "18500000",
    endDate: "2026-07-20T00:00:00Z"
  },
  {
    conditionId: "0xab12cd34ef56gh78ij90kl12mn34op56qr78st90",
    question: "Will the Fed hold interest rates steady at the July 2026 meeting?",
    category: "ECONOMICS",
    description: "This market resolves to YES if the FOMC announces no change to the federal funds rate at its meeting ending in late July 2026.",
    outcomePrices: ["0.85", "0.15"],
    volume: "12400000",
    endDate: "2026-07-30T00:00:00Z"
  },
  {
    conditionId: "0xbc123456789abcdef0123456789abcdef0123456",
    question: "Will Tadej Pogačar win the 2026 Tour de France?",
    category: "SPORTS",
    description: "This market resolves to YES if Tadej Pogačar wins the General Classification of the 2026 Tour de France.",
    outcomePrices: ["0.62", "0.38"],
    volume: "8200000",
    endDate: "2026-07-27T00:00:00Z"
  },
  {
    conditionId: "0xcd987654321fedcba0987654321fedcba0987654",
    question: "Will JD Vance win the 2028 US Presidential Election?",
    category: "POLITICS",
    description: "This market resolves to YES if JD Vance is elected President of the United States in the 2028 election.",
    outcomePrices: ["0.22", "0.78"],
    volume: "45300000",
    endDate: "2028-11-08T00:00:00Z"
  },
  {
    conditionId: "0xde11223344556677889900aabbccddeeff001122",
    question: "Will Bitcoin reach $150,000 in 2026?",
    category: "CRYPTO",
    description: "This market resolves to YES if Bitcoin hits $150,000.00 at any point on or before December 31, 2026.",
    outcomePrices: ["0.47", "0.53"],
    volume: "35600000",
    endDate: "2026-12-31T23:59:59Z"
  },
  {
    conditionId: "0xef667788990011223344556677889900aabbccdd",
    question: "Will OpenAI release GPT-5 in 2026?",
    category: "SCIENCE",
    description: "This market resolves to YES if OpenAI officially announces and releases GPT-5 as a model or API in 2026.",
    outcomePrices: ["0.55", "0.45"],
    volume: "14800000",
    endDate: "2026-12-31T23:59:59Z"
  }
];

export async function handleSyncPolymarket(req: Request) {
  if (!isDbConnected) {
    return jsonRes({ error: "Database not connected" }, 500);
  }

  let pmMarkets: any[] = [];
  try {
    const response = await fetch(POLYMARKET_GAMMA_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    if (response.ok) {
      pmMarkets = await response.json() as any[];
      console.log(`✅ Successfully fetched ${pmMarkets.length} active markets from Polymarket Gamma API.`);
    } else {
      console.warn(`⚠️ Polymarket API returned status ${response.status}. Using cached local fallback markets.`);
      pmMarkets = LOCAL_POLYMARKET_FALLBACK;
    }
  } catch (err) {
    console.warn(`⚠️ Polymarket API connection failed (${(err as Error).message}). Using cached local fallback markets.`);
    pmMarkets = LOCAL_POLYMARKET_FALLBACK;
  }

  try {
    let insertedCount = 0;
    let updatedCount = 0;

    // Find Market Maker for orderbook seeding
    const [marketMaker] = await db.select().from(users).where(eq(users.wallet, MARKET_MAKER_WALLET)).limit(1);

    for (const pm of pmMarkets) {
      if (!pm.question) continue;

      // Use conditionId as the stable Polymarket market identifier
      const polymarketId = pm.conditionId || pm.id || null;

      // Extract price from outcomePrices (first outcome = YES)
      const yesPriceFraction = pm.outcomePrices ? parseFloat(pm.outcomePrices[0]) : 0.5;
      const yesPrice = Math.min(99, Math.max(1, Math.round(yesPriceFraction * 100)));
      const noPrice = 100 - yesPrice;

      // Parse volume — Polymarket returns it as a decimal string of USD cents
      const volumeUsd = Math.round(parseFloat(pm.volume || pm.volumeNum || "0"));

      // Normalize category
      const category = (pm.category || (pm.tags && pm.tags[0]?.label) || (pm.tags && pm.tags[0]) || "General").substring(0, 100);
      const description = pm.description || `Polymarket: ${pm.question}`;
      const endTime = pm.endDate ? new Date(pm.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (polymarketId) {
        // Idempotent upsert by polymarketId
        const existing = await db.select().from(markets).where(eq(markets.polymarketId, polymarketId)).limit(1);
        if (existing.length > 0) {
          // Update prices and volume for existing market
          await db.update(markets)
            .set({ yesPrice, noPrice, volumeUsd })
            .where(eq(markets.polymarketId, polymarketId));
          updatedCount++;
          continue;
        }
      } else {
        // Fallback: check by question text
        const existing = await db.select().from(markets).where(sql`question = ${pm.question}`).limit(1);
        if (existing.length > 0) {
          await db.update(markets)
            .set({ yesPrice, noPrice, volumeUsd })
            .where(sql`question = ${pm.question}`);
          updatedCount++;
          continue;
        }
      }

      // Insert new market
      const [newMarket] = await db.insert(markets).values({
        polymarketId,
        question: pm.question,
        category,
        description,
        yesPrice,
        noPrice,
        volumeUsd,
        status: "OPEN",
        endTime,
      }).returning();

      insertedCount++;

      // Seed initial orderbook from Market Maker
      if (marketMaker) {
        try {
          await db.insert(positions).values([
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", quantity: 50000, averageBuyPrice: yesPrice },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO", quantity: 50000, averageBuyPrice: noPrice }
          ]);

          await db.insert(orders).values([
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "BUY",  price: Math.max(1, yesPrice - 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "BUY",  price: Math.max(1, yesPrice - 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: Math.min(99, yesPrice + 1), quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: Math.min(99, yesPrice + 2), quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO",  side: "BUY",  price: Math.max(1, noPrice - 1),  quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO",  side: "BUY",  price: Math.max(1, noPrice - 2),  quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO",  side: "SELL", price: Math.min(99, noPrice + 1),  quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
            { userId: marketMaker.id, marketId: newMarket.id, outcome: "NO",  side: "SELL", price: Math.min(99, noPrice + 2),  quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
          ]);
        } catch (e) {
          console.error(`Failed to seed orderbook for market ${newMarket.id}:`, e);
        }
      }
    }

    // Ensure Market Maker user exists for future syncs
    if (!marketMaker) {
      try {
        await db.insert(users).values({
          wallet: MARKET_MAKER_WALLET,
          balanceUsd: 10000000000, // $100,000,000 — institutional market maker
          depositAddress: "FnAGPJUxbqNSpJj5k538a5bJD4EuCBYtFLHZcrTxCcTt"
        });
        console.log("✅ Market Maker account created.");
      } catch (e) {
        // Already exists, ignore
      }
    }

    console.log(`✅ Polymarket sync: inserted=${insertedCount}, updated=${updatedCount}`);
    return jsonRes({ success: true, inserted: insertedCount, updated: updatedCount });
  } catch (err: any) {
    console.error("Polymarket sync error:", err);
    return jsonRes({ error: err.message }, 500);
  }
}

// Background sync tracker — only re-sync every 5 minutes
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export async function handleGetMarkets(url: URL) {
  // Trigger background sync if cache is stale
  if (isDbConnected && Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
    lastSyncTime = Date.now();
    handleSyncPolymarket(new Request("http://localhost/api/markets/sync", { method: "POST" }))
      .catch(err => console.error("Background Polymarket sync failed:", err));
  }

  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const sort = url.searchParams.get("sort") || "volume";

  if (!isDbConnected) {
    // DB not available — return empty (no fake data)
    return jsonRes([]);
  }

  // Build query conditions
  const conditions: any[] = [];
  if (search) {
    conditions.push(sql`question ILIKE ${'%' + search + '%'}`);
  }
  if (category) {
    conditions.push(sql`category ILIKE ${category}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByClause = sql`volume_usd DESC`;
  if (sort === "newest") {
    orderByClause = sql`created_at DESC`;
  } else if (sort === "ending_soon") {
    orderByClause = sql`end_time ASC`;
  } else if (sort === "liquidity") {
    orderByClause = sql`volume_usd DESC`;
  }

  const offset = (page - 1) * limit;

  const results = await db.select()
    .from(markets)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const mapped = results.map(m => ({
    id: m.id,
    title: m.question,
    category: m.category,
    event: m.category,
    description: m.description,
    yesPrice: m.yesPrice,
    noPrice: m.noPrice,
    probability: m.yesPrice / 100,
    volume: m.volumeUsd,
    liquidity: Math.round(m.volumeUsd * 0.15),
    endDate: m.endTime.toISOString(),
    status: m.status === "OPEN" ? "Active" : "Closed",
    outcomes: ["YES", "NO"],
    tokenIds: [],
    polymarketId: m.polymarketId
  }));

  return jsonRes(mapped);
}

export async function handleGetMarketDetail(url: URL) {
  const id = url.searchParams.get("id");
  if (!id) return jsonRes({ error: "Missing market id" }, 400);
  if (!isDbConnected) return jsonRes(null, 503);

  const results = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  const m = results[0];
  if (!m) return jsonRes(null, 404);

  // Fetch price history
  const history = await db.select().from(priceHistory)
    .where(eq(priceHistory.marketId, id))
    .orderBy(priceHistory.timestamp);

  // Fetch orderbook
  const pendingOrders = await db.select().from(orders)
    .where(and(eq(orders.marketId, id), or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))));

  const orderbook = {
    yes: { bids: [] as any[], asks: [] as any[] },
    no: { bids: [] as any[], asks: [] as any[] }
  };

  for (const order of pendingOrders) {
    const outcomeKey = order.outcome.toLowerCase() as "yes" | "no";
    const sideKey = order.side === "BUY" ? "bids" : "asks";
    const targetArray = orderbook[outcomeKey][sideKey];
    const existingLevel = targetArray.find((x: any) => x.price === order.price);
    if (existingLevel) {
      existingLevel.quantity += order.remainingQuantity;
    } else {
      targetArray.push({ price: order.price, quantity: order.remainingQuantity });
    }
  }

  orderbook.yes.bids.sort((a, b) => b.price - a.price);
  orderbook.yes.asks.sort((a, b) => a.price - b.price);
  orderbook.no.bids.sort((a, b) => b.price - a.price);
  orderbook.no.asks.sort((a, b) => a.price - b.price);

  return jsonRes({
    id: m.id,
    title: m.question,
    category: m.category,
    event: m.category,
    description: m.description,
    yesPrice: m.yesPrice,
    noPrice: m.noPrice,
    probability: m.yesPrice / 100,
    volume: m.volumeUsd,
    liquidity: Math.round(m.volumeUsd * 0.15),
    endDate: m.endTime.toISOString(),
    status: m.status === "OPEN" ? "Active" : "Closed",
    outcomes: ["YES", "NO"],
    resolutionDate: m.endTime.toISOString(),
    priceHistory: history,
    orderbook,
    polymarketId: m.polymarketId
  });
}

export async function handleGetOrderbook(url: URL) {
  const marketId = url.searchParams.get("marketId");
  if (!marketId) return jsonRes({ error: "Missing marketId" }, 400);
  if (!isDbConnected) return jsonRes({ yes: { bids: [], asks: [] }, no: { bids: [], asks: [] } });

  const pendingOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.marketId, marketId),
        or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
      )
    );

  const recentPending = await db
    .select({
      id: orders.id,
      outcome: orders.outcome,
      side: orders.side,
      price: orders.price,
      quantity: orders.quantity,
      remainingQuantity: orders.remainingQuantity,
      wallet: users.wallet,
      createdAt: orders.createdAt
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(orders.marketId, marketId),
        or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
      )
    )
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(10);

  const orderbook = {
    yes: { bids: {} as Record<number, number>, asks: {} as Record<number, number> },
    no: { bids: {} as Record<number, number>, asks: {} as Record<number, number> },
  };

  for (const order of pendingOrders) {
    const outcomeKey = order.outcome.toLowerCase() as "yes" | "no";
    const sideKey = order.side === "BUY" ? "bids" : "asks";
    const price = order.price;
    orderbook[outcomeKey][sideKey][price] = (orderbook[outcomeKey][sideKey][price] || 0) + order.remainingQuantity;
  }

  const formatLevels = (levels: Record<number, number>, isBids: boolean) => {
    return Object.entries(levels)
      .map(([price, quantity]) => ({ price: parseInt(price), quantity }))
      .sort((a, b) => isBids ? b.price - a.price : a.price - b.price);
  };

  return jsonRes({
    yes: { bids: formatLevels(orderbook.yes.bids, true), asks: formatLevels(orderbook.yes.asks, false) },
    no: { bids: formatLevels(orderbook.no.bids, true), asks: formatLevels(orderbook.no.asks, false) },
    recentOrders: recentPending
  });
}

export async function handleGetCharts(url: URL) {
  const marketId = url.searchParams.get("marketId");
  const range = url.searchParams.get("range") || "5d";
  if (!marketId || !isDbConnected) return jsonRes([]);

  let days = range === "14d" ? 14 : range === "1m" ? 30 : range === "1y" ? 365 : 5;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const history = await db.select().from(priceHistory)
    .where(and(eq(priceHistory.marketId, marketId), gt(priceHistory.timestamp, cutoff)))
    .orderBy(priceHistory.timestamp);
  return jsonRes(history);
}

export async function handleCreateManualMarket(req: Request) {
  if (!isDbConnected) {
    return jsonRes({ error: "Database not connected" }, 500);
  }

  try {
    const { question, category, description, rules, resolutionCriteria, yesPrice } = await req.json();
    if (!question || !category) {
      return jsonRes({ error: "Missing question or category" }, 400);
    }

    const initialYesPrice = yesPrice ? Math.max(5, Math.min(95, Number(yesPrice))) : 50;
    const initialNoPrice = 100 - initialYesPrice;
    const fullDescription = `${description || ""}\n\n**Rules**:\n${rules || "Standard PredictX rules."}\n\n**Resolution**:\n${resolutionCriteria || "Consensus news outlets."}`.substring(0, 999);

    const [newMarket] = await db.insert(markets).values({
      question,
      category,
      description: fullDescription,
      yesPrice: initialYesPrice,
      noPrice: initialNoPrice,
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "OPEN"
    }).returning();

    try {
      const mmWallet = "AquKi58ctfgm1cB9b93qNXrKtm9ABEqHqeLfyYZPSkDr";
      let mmUserRows = await db.select().from(users).where(eq(users.wallet, mmWallet));
      let mm = mmUserRows[0];
      if (!mm) {
        const [inserted] = await db.insert(users).values({ 
          wallet: mmWallet, 
          balanceUsd: 100000000, 
          depositAddress: "FnAGPJUxbqNSpJj5k538a5bJD4EuCBYtFLHZcrTxCcTt" 
        }).returning();
        mm = inserted;
      }
      
      await db.insert(positions).values([
        { userId: mm.id, marketId: newMarket.id, outcome: "YES", quantity: 50000, averageBuyPrice: initialYesPrice, status: "OPEN" },
        { userId: mm.id, marketId: newMarket.id, outcome: "NO", quantity: 50000, averageBuyPrice: initialNoPrice, status: "OPEN" }
      ]);

      await db.insert(orders).values([
        { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: initialYesPrice - 1, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "BUY", price: initialYesPrice - 2, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: initialYesPrice + 1, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "YES", side: "SELL", price: initialYesPrice + 2, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: initialNoPrice - 1, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "BUY", price: initialNoPrice - 2, quantity: 3000, remainingQuantity: 3000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: initialNoPrice + 1, quantity: 2000, remainingQuantity: 2000, status: "PENDING" },
        { userId: mm.id, marketId: newMarket.id, outcome: "NO", side: "SELL", price: initialNoPrice + 2, quantity: 3000, remainingQuantity: 3000, status: "PENDING" }
      ]);
    } catch (e) {
      console.error("Failed to seed orderbook for manual market:", e);
    }

    return jsonRes(newMarket);
  } catch (err: any) {
    return jsonRes({ error: err.message || err }, 500);
  }
}

export async function handleResolveManualMarket(req: Request) {
  if (!isDbConnected) {
    return jsonRes({ error: "Database not connected" }, 500);
  }

  try {
    const { marketId, outcome } = await req.json();
    if (!marketId || !outcome || (outcome !== "YES" && outcome !== "NO")) {
      return jsonRes({ error: "Missing marketId or outcome must be YES or NO" }, 400);
    }

    const marketRows = await db.select().from(markets).where(eq(markets.id, marketId));
    if (marketRows.length === 0) {
      return jsonRes({ error: "Market not found" }, 404);
    }
    if (marketRows[0].status === "RESOLVED") {
      return jsonRes({ error: "Market is already resolved" }, 400);
    }

    await db.transaction(async (tx) => {
      // 1. Update market outcome and status
      await tx.update(markets)
        .set({ status: "RESOLVED", resolutionOutcome: outcome })
        .where(eq(markets.id, marketId));

      // 2. Resolve all user positions
      const activePositions = await tx.select().from(positions).where(eq(positions.marketId, marketId));
      for (const pos of activePositions) {
        if (pos.quantity > 0) {
          if (pos.outcome === outcome) {
            const payout = pos.quantity * 100;
            const [user] = await tx.select().from(users).where(eq(users.id, pos.userId)).for("update");
            if (user) {
              await tx.update(users)
                .set({ balanceUsd: user.balanceUsd + payout })
                .where(eq(users.id, pos.userId));

              await tx.insert(transactions).values({
                userId: pos.userId,
                type: "SETTLEMENT",
                amountUsd: payout,
                details: { marketId, quantity: pos.quantity, outcome }
              });
            }
          }
        }
        await tx.update(positions)
          .set({ quantity: 0, status: "CLOSED" })
          .where(eq(positions.id, pos.id));
      }

      // 3. Refund pending BUY orders
      const pendingBuyOrders = await tx.select().from(orders).where(and(eq(orders.marketId, marketId), eq(orders.side, "BUY"), or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))));
      for (const order of pendingBuyOrders) {
        const refund = order.remainingQuantity * order.price;
        const [user] = await tx.select().from(users).where(eq(users.id, order.userId)).for("update");
        if (user) {
          await tx.update(users)
            .set({ balanceUsd: user.balanceUsd + refund })
            .where(eq(users.id, order.userId));

          await tx.insert(transactions).values({
            userId: order.userId,
            type: "REFUND",
            amountUsd: refund,
            details: { marketId, orderId: order.id, reason: "MARKET_RESOLVED" }
          });
        }
        await tx.update(orders).set({ status: "CANCELLED" }).where(eq(orders.id, order.id));
      }

      // 4. Cancel pending SELL orders
      await tx.update(orders)
        .set({ status: "CANCELLED" })
        .where(and(eq(orders.marketId, marketId), eq(orders.side, "SELL"), or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))));
    });

    return jsonRes({ success: true, message: `Market successfully resolved to ${outcome}` });
  } catch (err: any) {
    return jsonRes({ error: err.message || err }, 500);
  }
}
