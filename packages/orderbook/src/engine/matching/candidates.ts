import { eq, and, or } from "drizzle-orm";
import { orders } from "@nexus/db";
import { DbTransaction, logDebug } from "../types";

export async function fetchMatchCandidates(
  tx: DbTransaction,
  marketId: string,
  outcome: "YES" | "NO",
  oppositeOutcome: "YES" | "NO",
  side: "BUY" | "SELL",
  price: number,
  userId: string
) {
  if (side === "BUY") {
    logDebug("placeLimitOrder: Fetching match direct asks...");
    const directAsks = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.marketId, marketId),
          eq(orders.outcome, outcome),
          eq(orders.side, "SELL"),
          or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
        )
      )
      .for("update");

    logDebug("placeLimitOrder: Fetching match cross bids...");
    const crossBids = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.marketId, marketId),
          eq(orders.outcome, oppositeOutcome),
          eq(orders.side, "BUY"),
          or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
        )
      )
      .for("update");

    return [
      ...directAsks.map((c: any) => ({ ...c, isCross: false, equivPrice: c.price })),
      ...crossBids.map((c: any) => ({ ...c, isCross: true, equivPrice: 100 - c.price }))
    ]
      .filter((c: any) => c.equivPrice <= price && c.userId !== userId) // Cannot match self
      .sort((a: any, b: any) => a.equivPrice - b.equivPrice); // lowest equivalent price first
  } else {
    logDebug("placeLimitOrder: Fetching match direct bids...");
    const directBids = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.marketId, marketId),
          eq(orders.outcome, outcome),
          eq(orders.side, "BUY"),
          or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
        )
      )
      .for("update");

    logDebug("placeLimitOrder: Fetching match cross asks...");
    const crossAsks = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.marketId, marketId),
          eq(orders.outcome, oppositeOutcome),
          eq(orders.side, "SELL"),
          or(eq(orders.status, "PENDING"), eq(orders.status, "PARTIALLY_FILLED"))
        )
      )
      .for("update");

    return [
      ...directBids.map((c: any) => ({ ...c, isCross: false, equivPrice: c.price })),
      ...crossAsks.map((c: any) => ({ ...c, isCross: true, equivPrice: 100 - c.price }))
    ]
      .filter((c: any) => c.equivPrice >= price && c.userId !== userId)
      .sort((a: any, b: any) => b.equivPrice - a.equivPrice); // highest price first
  }
}
