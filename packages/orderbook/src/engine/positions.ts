import { eq, and, or } from "drizzle-orm";
import { users, positions, transactions, markets, orders } from "@nexus/db";
import { DbTransaction, logDebug, lockUserAndMarket } from "./types";

export async function adjustPosition(
  tx: DbTransaction,
  userId: string,
  marketId: string,
  outcome: "YES" | "NO",
  quantityChange: number,
  executionPrice?: number
) {
  if (typeof quantityChange !== "number" || isNaN(quantityChange) || !isFinite(quantityChange)) {
    throw new Error(`adjustPosition: Invalid quantityChange "${quantityChange}"`);
  }
  if (executionPrice !== undefined && (typeof executionPrice !== "number" || isNaN(executionPrice) || !isFinite(executionPrice))) {
    throw new Error(`adjustPosition: Invalid executionPrice "${executionPrice}"`);
  }

  logDebug(`adjustPosition: userId=${userId}, outcome=${outcome}, change=${quantityChange}, price=${executionPrice}`);
  const existing = await tx
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.userId, userId),
        eq(positions.marketId, marketId),
        eq(positions.outcome, outcome)
      )
    )
    .for("update");

  if (existing.length > 0) {
    const pos = existing[0];
    const newQty = pos.quantity + quantityChange;

    if (newQty < 0) {
      throw new Error(`Insufficient shares for position adjustment: current ${pos.quantity}, requested change ${quantityChange}`);
    }

    if (newQty === 0) {
      await tx
        .update(positions)
        .set({ quantity: 0, status: "CLOSED" })
        .where(eq(positions.id, pos.id));
    } else {
      let newAvgPrice = pos.averageBuyPrice;
      if (quantityChange > 0 && executionPrice !== undefined) {
        newAvgPrice = Math.round(
          (pos.quantity * pos.averageBuyPrice + quantityChange * executionPrice) / newQty
        );
      }
      if (typeof newAvgPrice !== "number" || isNaN(newAvgPrice) || !isFinite(newAvgPrice)) {
        newAvgPrice = executionPrice ?? pos.averageBuyPrice ?? 50;
      }
      const newStatus = quantityChange > 0 ? "OPEN" : "PARTIALLY_CLOSED";
      await tx
        .update(positions)
        .set({ quantity: newQty, averageBuyPrice: newAvgPrice, status: newStatus })
        .where(eq(positions.id, pos.id));
    }
  } else {
    if (quantityChange < 0) {
      throw new Error(`Insufficient shares: no position exists to deduct ${Math.abs(quantityChange)} shares`);
    }
    if (quantityChange > 0) {
      const avgPrice = executionPrice ?? 50;
      await tx.insert(positions).values({
        userId,
        marketId,
        outcome,
        quantity: quantityChange,
        averageBuyPrice: avgPrice,
        status: "OPEN",
      });
    }
  }
}

export async function splitPositions(tx: DbTransaction, userId: string, marketId: string, quantity: number) {
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");

  const { user, market } = await lockUserAndMarket(tx, userId, marketId);
  const cost = quantity * 100;

  if (user.balanceUsd < cost) {
    throw new Error(`Insufficient balance for split: required ${cost}¢, available ${user.balanceUsd}¢`);
  }

  await tx
    .update(users)
    .set({ balanceUsd: user.balanceUsd - cost })
    .where(eq(users.id, userId));

  await adjustPosition(tx, userId, marketId, "YES", quantity, market.yesPrice);
  await adjustPosition(tx, userId, marketId, "NO", quantity, market.noPrice);

  await tx.insert(transactions).values({
    userId,
    type: "SPLIT",
    amountUsd: -cost,
    details: { quantity, marketId, yesPrice: market.yesPrice, noPrice: market.noPrice },
  });

  return { success: true };
}

export async function mergePositions(tx: DbTransaction, userId: string, marketId: string, quantity: number) {
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");

  const { user } = await lockUserAndMarket(tx, userId, marketId);
  const payout = quantity * 100;

  await adjustPosition(tx, userId, marketId, "YES", -quantity);
  await adjustPosition(tx, userId, marketId, "NO", -quantity);

  await tx
    .update(users)
    .set({ balanceUsd: user.balanceUsd + payout })
    .where(eq(users.id, userId));

  await tx.insert(transactions).values({
    userId,
    type: "MERGE",
    amountUsd: payout,
    details: { quantity, marketId },
  });

  return { success: true };
}

export type ValidationResult = 
  | { status: "VALID"; adjustedQuantity: number }
  | { status: "SKIPPED"; reason: "Validation Error" | "Insufficient Cash" | "Insufficient Shares" | "Position Missing" | "Market Closed" | "Duplicate Order" | "Zero Quantity" };

export async function validatePreTrade(
  tx: DbTransaction,
  userId: string,
  marketId: string,
  intent: { action: "BUY" | "SELL" | "HOLD"; outcome: "YES" | "NO"; price: number; quantity: number }
): Promise<ValidationResult> {
  if (intent.action === "HOLD" || intent.quantity <= 0) {
    return { status: "SKIPPED", reason: "Zero Quantity" };
  }

  // 1. Get market and verify it is active
  const marketRows = await tx
    .select({ id: markets.id, status: markets.status })
    .from(markets)
    .where(eq(markets.id, marketId));
  if (marketRows.length === 0 || marketRows[0].status !== "OPEN") {
    return { status: "SKIPPED", reason: "Market Closed" };
  }

  if (intent.action === "BUY") {
    // 2. Get user balance
    const userRows = await tx
      .select({ balanceUsd: users.balanceUsd })
      .from(users)
      .where(eq(users.id, userId));
    if (userRows.length === 0) {
      return { status: "SKIPPED", reason: "Validation Error" };
    }
    const balance = userRows[0].balanceUsd;
    const cost = intent.price * intent.quantity;
    if (balance < cost) {
      if (balance < intent.price) {
        return { status: "SKIPPED", reason: "Insufficient Cash" };
      }
      const maxAffordable = Math.floor(balance / intent.price);
      return { status: "VALID", adjustedQuantity: maxAffordable };
    }
    return { status: "VALID", adjustedQuantity: intent.quantity };
  } else {
    // SELL
    const posRows = await tx
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.userId, userId),
          eq(positions.marketId, marketId),
          eq(positions.outcome, intent.outcome)
        )
      )
      .for("update");
    if (posRows.length === 0 || posRows[0].status === "CLOSED" || posRows[0].quantity <= 0) {
      return { status: "SKIPPED", reason: "Position Missing" };
    }

    const pos = posRows[0];

    const pendingOrders = await tx
      .select({ quantity: orders.remainingQuantity })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.marketId, marketId),
          eq(orders.outcome, intent.outcome),
          eq(orders.side, "SELL"),
          or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
        )
      );
    const lockedQty = pendingOrders.reduce((sum: number, o: { quantity: number }) => sum + o.quantity, 0);
    const availableToSell = pos.quantity - lockedQty;

    if (availableToSell <= 0) {
      return { status: "SKIPPED", reason: "Duplicate Order" };
    }

    if (intent.quantity > availableToSell) {
      return { status: "VALID", adjustedQuantity: availableToSell };
    }

    return { status: "VALID", adjustedQuantity: intent.quantity };
  }
}
