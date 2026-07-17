import crypto from "crypto";
import { mockMarkets, mockPositions, mockTransactions, mockFraudAlerts } from "../mockStore";

export async function executeMockTrade(
  userId: string,
  marketId: string,
  outcome: string,
  side: "BUY" | "SELL",
  price: number,
  quantity: number
) {
  const m = mockMarkets.find(x => x.id === marketId);
  if (!m) throw new Error("Market not found");

  const cost = price * quantity;

  // 1. Check fraud anomalies
  const recentTrade = mockTransactions.find(t => 
    t.userId === userId && 
    t.details?.marketId === marketId && 
    (Date.now() - new Date(t.createdAt).getTime()) < 30000
  );
  
  if (recentTrade) {
    mockFraudAlerts.push({
      id: crypto.randomUUID(),
      marketId,
      userId,
      type: "WASH_TRADING",
      severity: "HIGH",
      description: `Potential wash trading: User executed multiple trades on outcome "${outcome}" in less than 30s.`,
      status: "ACTIVE",
      createdAt: new Date()
    });
  }
  
  if (cost > 500000) { // $5,000 USD
    mockFraudAlerts.push({
      id: crypto.randomUUID(),
      marketId,
      userId,
      type: "UNUSUAL_VOLUME",
      severity: "MEDIUM",
      description: `Large trade volume: User placed an order totaling $${(cost / 100).toFixed(2)} USD.`,
      status: "ACTIVE",
      createdAt: new Date()
    });
  }

  // Update mock positions
  let pos = mockPositions.find(p => p.userId === userId && p.marketId === marketId && p.outcome === outcome);
  if (side === "BUY") {
    if (pos) {
      const totalCost = (pos.quantity * pos.averageBuyPrice) + cost;
      pos.quantity += quantity;
      pos.averageBuyPrice = Math.round(totalCost / pos.quantity);
    } else {
      mockPositions.push({
        id: crypto.randomUUID(),
        userId,
        marketId,
        outcome,
        quantity,
        averageBuyPrice: price,
        createdAt: new Date()
      });
    }
  } else { // SELL
    if (!pos || pos.quantity < quantity) {
      throw new Error("You cannot sell more than the purchased stocks");
    }
    pos.quantity -= quantity;
    if (pos.quantity === 0) {
      const idx = mockPositions.indexOf(pos);
      mockPositions.splice(idx, 1);
    }
  }

  // Record transaction
  mockTransactions.push({
    id: crypto.randomUUID(),
    userId,
    type: side === "BUY" ? "TRADE_BUY" : "TRADE_SELL",
    amountUsd: side === "BUY" ? -cost : cost,
    details: { marketId, outcome, quantity, price },
    createdAt: new Date()
  });

  // Shift market price slightly
  const oldPrice = m.yesPrice;
  if ((side === "BUY" && outcome === "YES") || (side === "SELL" && outcome === "NO")) {
    m.yesPrice = Math.min(99, m.yesPrice + 1);
    m.noPrice = 100 - m.yesPrice;
  } else {
    m.yesPrice = Math.max(1, m.yesPrice - 1);
    m.noPrice = 100 - m.yesPrice;
  }

  // Price manipulation check
  if (Math.abs(m.yesPrice - oldPrice) > 10) {
    mockFraudAlerts.push({
      id: crypto.randomUUID(),
      marketId,
      userId,
      type: "PRICE_MANIPULATION",
      severity: "CRITICAL",
      description: `Market price shifted significantly from ${oldPrice}¢ to ${m.yesPrice}¢.`,
      status: "ACTIVE",
      createdAt: new Date()
    });
  }

  return { status: "FILLED" };
}
