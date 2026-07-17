import { eq } from "drizzle-orm";
import { users, orders, transactions } from "@nexus/db";
import { DbTransaction, logDebug } from "../types";
import { adjustPosition } from "../positions";

export async function executeMatches(
  tx: DbTransaction,
  side: "BUY" | "SELL",
  outcome: "YES" | "NO",
  oppositeOutcome: "YES" | "NO",
  price: number,
  userId: string,
  marketId: string,
  candidates: any[],
  quantity: number
) {
  let takerRemaining = quantity;
  let totalVolumeMatched = 0;
  let lastTradedPrice = 50; // fallback
  let takerCashChange = 0;

  for (const maker of candidates) {
    if (takerRemaining <= 0) break;

    const fillQty = Math.min(takerRemaining, maker.remainingQuantity);
    logDebug(`placeLimitOrder: Match loop. Taker remaining=${takerRemaining}, maker remaining=${maker.remainingQuantity}, fillQty=${fillQty}`);

    const makerNewRemaining = maker.remainingQuantity - fillQty;
    const makerStatus = makerNewRemaining === 0 ? "FILLED" : "PARTIALLY_FILLED";
    
    logDebug(`placeLimitOrder: Updating maker order status. ID=${maker.id}, newRemaining=${makerNewRemaining}, status=${makerStatus}`);
    await tx
      .update(orders)
      .set({ remainingQuantity: makerNewRemaining, status: makerStatus })
      .where(eq(orders.id, maker.id));

    if (side === "BUY") {
      if (maker.isCross) {
        logDebug("placeLimitOrder: Matching cross order...");
        const takerRefund = fillQty * (price - maker.equivPrice);
        if (takerRefund > 0) {
          logDebug(`placeLimitOrder: Refunding taker ${takerRefund} cents...`);
          const takerUser = await tx.select().from(users).where(eq(users.id, userId)).for("update");
          await tx
            .update(users)
            .set({ balanceUsd: takerUser[0].balanceUsd + takerRefund })
            .where(eq(users.id, userId));
        }

        logDebug("placeLimitOrder: Adjusting position for taker...");
        await adjustPosition(tx, userId, marketId, outcome, fillQty, maker.equivPrice);
        logDebug("placeLimitOrder: Adjusting position for maker...");
        await adjustPosition(tx, maker.userId, marketId, oppositeOutcome, fillQty, maker.price);

        logDebug("placeLimitOrder: Logging cross transaction for maker...");
        await tx.insert(transactions).values({
          userId: maker.userId,
          type: "TRADE_BUY",
          amountUsd: -(fillQty * maker.price),
          details: { orderId: maker.id, marketId, outcome: oppositeOutcome, quantity: fillQty, price: maker.price },
        });

        takerCashChange -= fillQty * maker.equivPrice;
      } else {
        logDebug("placeLimitOrder: Matching direct order...");
        const takerCost = fillQty * maker.price;
        const takerRefund = fillQty * (price - maker.price);
        if (takerRefund > 0) {
          logDebug(`placeLimitOrder: Refunding taker ${takerRefund} cents...`);
          const takerUser = await tx.select().from(users).where(eq(users.id, userId)).for("update");
          await tx
            .update(users)
            .set({ balanceUsd: takerUser[0].balanceUsd + takerRefund })
            .where(eq(users.id, userId));
        }

        logDebug("placeLimitOrder: Adjusting position for taker...");
        await adjustPosition(tx, userId, marketId, outcome, fillQty, maker.price);

        logDebug("placeLimitOrder: Crediting maker user balance...");
        const makerUser = await tx.select().from(users).where(eq(users.id, maker.userId)).for("update");
        await tx
          .update(users)
          .set({ balanceUsd: makerUser[0].balanceUsd + takerCost })
          .where(eq(users.id, maker.userId));

        logDebug("placeLimitOrder: Logging direct transaction for maker...");
        await tx.insert(transactions).values({
          userId: maker.userId,
          type: "TRADE_SELL",
          amountUsd: takerCost,
          details: { orderId: maker.id, marketId, outcome, quantity: fillQty, price: maker.price },
        });

        takerCashChange -= fillQty * maker.price;
      }
      lastTradedPrice = maker.equivPrice;
    } else {
      // SELL
      if (maker.isCross) {
        logDebug("placeLimitOrder: Matching cross order...");
        const takerPayout = fillQty * maker.equivPrice;

        logDebug("placeLimitOrder: Crediting taker user balance...");
        const takerUser = await tx.select().from(users).where(eq(users.id, userId)).for("update");
        await tx
          .update(users)
          .set({ balanceUsd: takerUser[0].balanceUsd + takerPayout })
          .where(eq(users.id, userId));

        logDebug("placeLimitOrder: Crediting maker user balance...");
        const makerUser = await tx.select().from(users).where(eq(users.id, maker.userId)).for("update");
        await tx
          .update(users)
          .set({ balanceUsd: makerUser[0].balanceUsd + fillQty * maker.price })
          .where(eq(users.id, maker.userId));

        logDebug("placeLimitOrder: Logging cross transaction for maker...");
        await tx.insert(transactions).values({
          userId: maker.userId,
          type: "TRADE_SELL",
          amountUsd: fillQty * maker.price,
          details: { orderId: maker.id, marketId, outcome: oppositeOutcome, quantity: fillQty, price: maker.price },
        });

        takerCashChange += fillQty * maker.equivPrice;
      } else {
        logDebug("placeLimitOrder: Matching direct order...");
        const takerPayout = fillQty * maker.price;

        logDebug("placeLimitOrder: Crediting taker user balance...");
        const takerUser = await tx.select().from(users).where(eq(users.id, userId)).for("update");
        await tx
          .update(users)
          .set({ balanceUsd: takerUser[0].balanceUsd + takerPayout })
          .where(eq(users.id, userId));

        logDebug("placeLimitOrder: Adjusting position for maker...");
        await adjustPosition(tx, maker.userId, marketId, outcome, fillQty, maker.price);

        logDebug("placeLimitOrder: Logging direct transaction for maker...");
        await tx.insert(transactions).values({
          userId: maker.userId,
          type: "TRADE_BUY",
          amountUsd: -takerPayout,
          details: { orderId: maker.id, marketId, outcome, quantity: fillQty, price: maker.price },
        });

        takerCashChange += fillQty * maker.price;
      }
      lastTradedPrice = maker.equivPrice;
    }

    takerRemaining -= fillQty;
    totalVolumeMatched += fillQty * 100;
  }

  return { takerRemaining, totalVolumeMatched, lastTradedPrice, takerCashChange };
}
