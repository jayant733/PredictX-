import { eq } from "drizzle-orm";
import { users } from "@nexus/db";
import { DbTransaction, logDebug } from "../types";
import { adjustPosition } from "../positions";

export async function escrowTakerAssets(
  tx: DbTransaction,
  userId: string,
  marketId: string,
  outcome: "YES" | "NO",
  side: "BUY" | "SELL",
  price: number,
  quantity: number,
  user: any
) {
  if (side === "BUY") {
    const totalCost = price * quantity;
    logDebug(`placeLimitOrder: Escrowing buyer assets. cost=${totalCost}, balance=${user.balanceUsd}`);
    if (user.balanceUsd < totalCost) {
      throw new Error(`Insufficient balance: need ${totalCost}¢, have ${user.balanceUsd}¢`);
    }
    await tx
      .update(users)
      .set({ balanceUsd: user.balanceUsd - totalCost })
      .where(eq(users.id, userId));
    logDebug("placeLimitOrder: Buyer assets escrowed successfully.");
  } else {
    logDebug("placeLimitOrder: Verifying seller assets...");
    await adjustPosition(tx, userId, marketId, outcome, -quantity);
  }
}
