import { eq } from "drizzle-orm";
import { orders } from "@nexus/db";
import { DbTransaction, logDebug, lockUserAndMarket } from "./types";
import { escrowTakerAssets } from "./matching/escrow";
import { fetchMatchCandidates } from "./matching/candidates";
import { executeMatches } from "./matching/executor";
import { updateTakerAndMarketStats } from "./matching/updater";

export async function placeLimitOrder(
  tx: DbTransaction,
  userId: string,
  marketId: string,
  outcome: "YES" | "NO",
  side: "BUY" | "SELL",
  price: number,
  quantity: number
) {
  try {
    logDebug(`placeLimitOrder: START. userId=${userId}, marketId=${marketId}, outcome=${outcome}, side=${side}, price=${price}, quantity=${quantity}`);
    if (typeof price !== "number" || isNaN(price) || !isFinite(price) || price < 1 || price > 99) {
      throw new Error(`Invalid price: ${price}. Price must be a number between 1 and 99 cents.`);
    }
    if (typeof quantity !== "number" || isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity: ${quantity}. Quantity must be a positive number.`);
    }

    const { user, market } = await lockUserAndMarket(tx, userId, marketId);

    // Escrow taker assets
    await escrowTakerAssets(tx, userId, marketId, outcome, side, price, quantity, user);

    // Create resting order entry first
    logDebug("placeLimitOrder: Creating resting order entry...");
    const [insertedOrder] = await tx
      .insert(orders)
      .values({
        userId,
        marketId,
        outcome,
        side,
        price,
        quantity,
        remainingQuantity: quantity,
        status: "PENDING",
      })
      .returning();
    logDebug(`placeLimitOrder: Resting order created. ID=${insertedOrder.id}`);

    const oppositeOutcome = outcome === "YES" ? "NO" : "YES";

    // FETCH MATCH CANDIDATES
    const candidates = await fetchMatchCandidates(tx, marketId, outcome, oppositeOutcome, side, price, userId);

    // EXECUTE MATCHES
    const { takerRemaining, totalVolumeMatched, lastTradedPrice, takerCashChange } = await executeMatches(
      tx,
      side,
      outcome,
      oppositeOutcome,
      price,
      userId,
      marketId,
      candidates,
      quantity
    );

    // UPDATE TAKER STATUS AND MARKET STATS
    await updateTakerAndMarketStats(
      tx,
      insertedOrder.id,
      takerRemaining,
      quantity,
      totalVolumeMatched,
      lastTradedPrice,
      market,
      marketId,
      side,
      outcome,
      takerCashChange,
      userId
    );

    logDebug("placeLimitOrder: DONE success!");
    return { 
      orderId: insertedOrder.id, 
      remainingQuantity: takerRemaining, 
      status: takerRemaining === 0 ? "FILLED" : (takerRemaining === quantity ? "PENDING" : "PARTIALLY_FILLED") as any
    };
  } catch (err) {
    logDebug(`placeLimitOrder: ERROR! ${(err as Error).stack}`);
    throw err;
  }
}
