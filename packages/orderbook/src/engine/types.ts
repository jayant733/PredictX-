import { eq } from "drizzle-orm";
import { users, markets } from "@nexus/db";

export type DbTransaction = any;

const fs = require('fs');
const LOG_FILE = 'C:/Users/jayan/.gemini/antigravity/scratch/error.log';

export function logDebug(msg: string) {
  try {
    fs.appendFileSync(LOG_FILE, `[DEBUG ENGINE] ${msg}\n`);
  } catch (e) {}
}

export async function lockUserAndMarket(tx: DbTransaction, userId: string, marketId: string) {
  logDebug("lockUserAndMarket: Locking market row...");
  const marketRows = await tx
    .select({ id: markets.id, yesPrice: markets.yesPrice, noPrice: markets.noPrice, volumeUsd: markets.volumeUsd })
    .from(markets)
    .where(eq(markets.id, marketId))
    .for("update");
  
  logDebug("lockUserAndMarket: Locking user row...");
  const userRows = await tx
    .select({ id: users.id, balanceUsd: users.balanceUsd })
    .from(users)
    .where(eq(users.id, userId))
    .for("update");

  if (marketRows.length === 0) throw new Error("Market not found");
  if (userRows.length === 0) throw new Error("User not found");

  logDebug(`lockUserAndMarket: Found market (yesPrice=${marketRows[0].yesPrice}, noPrice=${marketRows[0].noPrice})`);
  logDebug(`lockUserAndMarket: Found user (balanceUsd=${userRows[0].balanceUsd})`);

  return { user: userRows[0], market: marketRows[0] };
}
