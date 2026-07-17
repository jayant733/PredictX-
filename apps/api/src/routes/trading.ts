import { eq, and, gt, sql } from "drizzle-orm";
import { db, isDbConnected } from "../db";
import { users, markets, orders, positions, transactions, fraudAlerts, userBotSettings } from "@nexus/db";
import { mockPositions, mockTransactions } from "../mockStore";
import { jsonRes } from "../utils/response";
import { executeMockTrade } from "../utils/mockTrade";
import { placeLimitOrder, splitPositions, mergePositions } from "@nexus/orderbook";
import { serverInstance } from "../services/microstructure";

export async function handleGetBalance(session: any) {
  if (!isDbConnected) {
    const userPositions = mockPositions.filter(p => p.userId === session.id);
    let portfolioValue = 0;
    for (const pos of userPositions) {
      const m = mockPositions.find(x => x.id === pos.marketId) as any;
      const currentPrice = pos.outcome === "YES" ? (m?.yesPrice || 50) : (m?.noPrice || 50);
      portfolioValue += pos.quantity * currentPrice;
    }
    const balanceUsd = 10000000;
    return jsonRes({
      balanceUsd,
      portfolioValueUsd: portfolioValue,
      totalAllocatedCents: 0,
      totalReservedCents: 0,
      totalNetWorth: balanceUsd + portfolioValue
    });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return jsonRes({ error: "User not found" }, 404);

  const activeSettings = await db.select().from(userBotSettings)
    .where(eq(userBotSettings.userId, session.id));

  const totalAllocated = activeSettings.reduce((sum, row) => sum + (row.enabled ? row.allocatedBalanceCents : 0), 0);
  const totalReserved = activeSettings.reduce((sum, row) => sum + (row.enabled ? row.reservedBalanceCents : 0), 0);

  const userPositions = await db.select().from(positions).where(eq(positions.userId, session.id));
  let marketValue = 0;

  if (userPositions.length > 0) {
    const marketIds = [...new Set(userPositions.map(p => p.marketId))];
    const userMarkets = await db.select().from(markets).where(sql`${markets.id} IN ${marketIds}`);
    const marketPriceMap = new Map(userMarkets.map(m => [m.id, m]));

    for (const pos of userPositions) {
      const m = marketPriceMap.get(pos.marketId);
      if (m) {
        const price = pos.outcome === "YES" ? m.yesPrice : m.noPrice;
        marketValue += pos.quantity * price;
      }
    }
  }

  const freeWalletCents = user.balanceUsd;
  const totalEquityCents = freeWalletCents + totalAllocated + totalReserved + marketValue;

  return jsonRes({
    balanceUsd: freeWalletCents,
    portfolioValueUsd: marketValue,
    totalAllocatedCents: totalAllocated,
    totalReservedCents: totalReserved,
    totalNetWorth: totalEquityCents
  });
}

export async function handleGetPositions(session: any) {
  if (!isDbConnected) {
    return jsonRes(mockPositions.filter(p => p.userId === session.id));
  }
  const userPositions = await db.select().from(positions).where(eq(positions.userId, session.id));
  return jsonRes(userPositions);
}

export async function handleGetHistory(session: any) {
  if (!isDbConnected) {
    return jsonRes(mockTransactions.filter(t => t.userId === session.id).map(t => ({
      id: t.id,
      userId: t.userId,
      marketId: t.details.marketId,
      outcome: t.details.outcome,
      side: t.type === "TRADE_BUY" ? "BUY" : "SELL",
      price: t.details.price,
      quantity: t.details.quantity,
      remainingQuantity: 0,
      status: "FILLED",
      createdAt: t.createdAt
    })));
  }
  const userOrders = await db.select().from(orders).where(eq(orders.userId, session.id));
  return jsonRes(userOrders);
}

export async function handleTrade(req: Request, session: any, side: "BUY" | "SELL") {
  const { marketId, outcome, price, quantity } = await req.json();
  const parsedPrice = Math.round(Number(price));
  const parsedQty = Math.round(Number(quantity));

  if (!marketId || !outcome || isNaN(parsedPrice) || isNaN(parsedQty) || parsedPrice <= 0 || parsedQty <= 0) {
    return jsonRes({ error: "Missing or invalid required fields" }, 400);
  }

  if (!isDbConnected) {
    const result = await executeMockTrade(session.id, marketId, outcome, side, parsedPrice, parsedQty);
    return jsonRes(result);
  }

  const oldMarket = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
  const oldPrice = oldMarket[0]?.yesPrice || 50;

  const cost = parsedPrice * parsedQty;
  const result = await db.transaction(async (tx) => {
    return await placeLimitOrder(tx, session.id, marketId, outcome, side, parsedPrice, parsedQty);
  });

  try {
    const newMarket = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
    const newPrice = newMarket[0]?.yesPrice || 50;
    if (Math.abs(newPrice - oldPrice) > 10) {
      await db.insert(fraudAlerts).values({
        marketId,
        userId: session.id,
        type: "PRICE_MANIPULATION",
        severity: "CRITICAL",
        description: `Market price shifted significantly from ${oldPrice}¢ to ${newPrice}¢.`,
        status: "ACTIVE"
      });
    }

    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentTx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, session.id), gt(transactions.createdAt, thirtySecondsAgo), sql`details->>'marketId' = ${marketId}`));
    
    if (recentTx.length > 0) {
      await db.insert(fraudAlerts).values({
        marketId,
        userId: session.id,
        type: "WASH_TRADING",
        severity: "HIGH",
        description: `User executed multiple trades on market outcomes within 30 seconds (Wash Trading pattern).`,
        status: "ACTIVE"
      });
    }

    if (cost > 500000) { // $5,000 USD
      await db.insert(fraudAlerts).values({
        marketId,
        userId: session.id,
        type: "UNUSUAL_VOLUME",
        severity: "MEDIUM",
        description: `Large order size detected: Trade total is $${(cost / 100).toFixed(2)} USD.`,
        status: "ACTIVE"
      });
    }
  } catch (e) {
    console.error("Fraud detection check failed:", e);
  }

  if (serverInstance) {
    serverInstance.publish("price-updates", JSON.stringify({
      type: "PORTFOLIO_UPDATE",
      userId: session.id
    }));
  }

  return jsonRes(result);
}

export async function handleSplit(req: Request, session: any) {
  if (!isDbConnected || !session) return jsonRes({ error: "DB not connected" }, 500);
  const { marketId, quantity } = await req.json();
  if (!marketId || !quantity) return jsonRes({ error: "Missing required fields" }, 400);

  const result = await db.transaction(async (tx) => {
    return await splitPositions(tx, session.id, marketId, quantity);
  });

  if (serverInstance) {
    serverInstance.publish("price-updates", JSON.stringify({
      type: "PORTFOLIO_UPDATE",
      userId: session.id
    }));
  }

  return jsonRes(result);
}

export async function handleMerge(req: Request, session: any) {
  if (!isDbConnected || !session) return jsonRes({ error: "DB not connected" }, 500);
  const { marketId, quantity } = await req.json();
  if (!marketId || !quantity) return jsonRes({ error: "Missing required fields" }, 400);

  const result = await db.transaction(async (tx) => {
    return await mergePositions(tx, session.id, marketId, quantity);
  });

  if (serverInstance) {
    serverInstance.publish("price-updates", JSON.stringify({
      type: "PORTFOLIO_UPDATE",
      userId: session.id
    }));
  }

  return jsonRes(result);
}
