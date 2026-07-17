import { eq, and } from "drizzle-orm";
import { users, markets, orders } from "@nexus/db";
import { DbTransaction } from "./types";
import { adjustPosition } from "./positions";

export async function cancelOrder(tx: DbTransaction, userId: string, orderId: string) {
  const orderRows = await tx
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .for("update");

  if (orderRows.length === 0) throw new Error("Order not found or access denied");
  const order = orderRows[0];

  if (order.status !== "PENDING" && order.status !== "PARTIALLY_FILLED") {
    throw new Error(`Cannot cancel order in status ${order.status}`);
  }

  // Lock market to prevent concurrency issues
  await tx.select({ id: markets.id }).from(markets).where(eq(markets.id, order.marketId)).for("update");

  // Release escrowed assets
  if (order.side === "BUY") {
    // Refund remaining USD cash
    const refundUsd = order.remainingQuantity * order.price;
    const userRows = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    await tx
      .update(users)
      .set({ balanceUsd: userRows[0].balanceUsd + refundUsd })
      .where(eq(users.id, userId));
  } else {
    // Refund remaining shares
    await adjustPosition(tx, userId, order.marketId, order.outcome as "YES" | "NO", order.remainingQuantity);
  }

  // Update order status
  await tx
    .update(orders)
    .set({ status: "CANCELLED", remainingQuantity: 0 })
    .where(eq(orders.id, orderId));

  return { success: true };
}
