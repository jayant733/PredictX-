import { eq } from "drizzle-orm";
import { markets, orders, priceHistory, transactions } from "@nexus/db";
import { DbTransaction, logDebug } from "../types";

export async function updateTakerAndMarketStats(
  tx: DbTransaction,
  insertedOrderId: string,
  takerRemaining: number,
  quantity: number,
  totalVolumeMatched: number,
  lastTradedPrice: number,
  market: any,
  marketId: string,
  side: "BUY" | "SELL",
  outcome: "YES" | "NO",
  takerCashChange: number,
  userId: string
) {
  const takerStatus = takerRemaining === 0 ? "FILLED" : (takerRemaining === quantity ? "PENDING" : "PARTIALLY_FILLED");
  logDebug(`placeLimitOrder: Updating taker order status. ID=${insertedOrderId}, status=${takerStatus}, remaining=${takerRemaining}`);
  await tx
    .update(orders)
    .set({ remainingQuantity: takerRemaining, status: takerStatus })
    .where(eq(orders.id, insertedOrderId));

  if (totalVolumeMatched > 0) {
    let updatedYesPrice = lastTradedPrice;
    if (side === "BUY" && outcome === "YES") {
      updatedYesPrice = Math.min(99, lastTradedPrice + 1);
    } else if (side === "BUY" && outcome === "NO") {
      updatedYesPrice = Math.max(1, lastTradedPrice - 1);
    } else if (side === "SELL" && outcome === "YES") {
      updatedYesPrice = Math.max(1, lastTradedPrice - 1);
    } else if (side === "SELL" && outcome === "NO") {
      updatedYesPrice = Math.min(99, lastTradedPrice + 1);
    }

    const updatedNoPrice = 100 - updatedYesPrice;
    logDebug(`placeLimitOrder: Volume matched. yesPrice=${updatedYesPrice}, noPrice=${updatedNoPrice}, vol=${totalVolumeMatched}`);

    logDebug("placeLimitOrder: Updating market stats...");
    await tx
      .update(markets)
      .set({
        yesPrice: updatedYesPrice,
        noPrice: updatedNoPrice,
        volumeUsd: market.volumeUsd + totalVolumeMatched,
      })
      .where(eq(markets.id, marketId));

    logDebug("placeLimitOrder: Inserting price history...");
    await tx.insert(priceHistory).values({
      marketId,
      yesPrice: updatedYesPrice,
      noPrice: updatedNoPrice,
      volumeUsd: totalVolumeMatched,
    });
  }

  const filledQty = quantity - takerRemaining;
  logDebug(`placeLimitOrder: Fills completed. filledQty=${filledQty}`);
  if (filledQty > 0) {
    logDebug(`placeLimitOrder: Inserting taker transaction log. amountUsd=${takerCashChange}`);
    await tx.insert(transactions).values({
      userId,
      type: side === "BUY" ? "TRADE_BUY" : "TRADE_SELL",
      amountUsd: takerCashChange,
      details: { orderId: insertedOrderId, marketId, outcome, quantity: filledQty, side },
    });
  }
}
