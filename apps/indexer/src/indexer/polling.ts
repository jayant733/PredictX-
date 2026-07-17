import { Connection, PublicKey } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import { users, depositLogs } from "@nexus/db";
import { DbTransaction } from "@nexus/orderbook";

// Global cache to reduce database lookups
export const processedSignatures = new Set<string>();

export async function processDeposit(
  db: any,
  SOL_PRICE_USD_CENTS: number,
  userId: string,
  depositAddress: string,
  signature: string,
  lamportsReceived: number
) {
  const solAmount = lamportsReceived / 1e9;
  const usdCentsCredit = Math.round(solAmount * SOL_PRICE_USD_CENTS);

  if (usdCentsCredit <= 0) return;

  console.log(`💰 Processing deposit for user ${userId}: ${solAmount} SOL -> $${(usdCentsCredit / 100).toFixed(2)}`);

  try {
    await db.transaction(async (tx: DbTransaction) => {
      const existing = await tx
        .select()
        .from(depositLogs)
        .where(eq(depositLogs.solanaTxSignature, signature))
        .for("update");

      if (existing.length > 0) {
        console.log(`ℹ️ Signature ${signature} already processed.`);
        return;
      }

      const userRows = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .for("update");

      if (userRows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      const user = userRows[0];

      await tx
        .update(users)
        .set({ balanceUsd: user.balanceUsd + usdCentsCredit })
        .where(eq(users.id, userId));

      await tx.insert(depositLogs).values({
        userId,
        solanaTxSignature: signature,
        amountSol: lamportsReceived.toString(),
        amountUsd: usdCentsCredit,
        status: "PROCESSED",
      });

      console.log(`✅ Credited user ${userId} with $${(usdCentsCredit / 100).toFixed(2)} USD.`);
    });
  } catch (err) {
    console.error(`❌ Failed to credit deposit for sig ${signature}:`, err);
  }
}

export async function checkDepositAddress(
  db: any,
  connection: Connection | null,
  SOL_PRICE_USD_CENTS: number,
  userId: string,
  depositAddress: string
) {
  if (!connection) {
    if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
      const mockSig = "mock_sig_" + Math.random().toString(36).substring(2, 15);
      const mockLamports = Math.floor(Math.random() * 2 * 1e9);
      console.log(`[SIMULATION] Simulating deposit to ${depositAddress}`);
      await processDeposit(db, SOL_PRICE_USD_CENTS, userId, depositAddress, mockSig, mockLamports);
    }
    return;
  }

  try {
    const pubkey = new PublicKey(depositAddress);
    const sigInfos = await connection.getSignaturesForAddress(pubkey, { limit: 5 });
    
    for (const info of sigInfos) {
      const signature = info.signature;
      if (processedSignatures.has(signature)) continue;

      const existing = await db
        .select({ id: depositLogs.id })
        .from(depositLogs)
        .where(eq(depositLogs.solanaTxSignature, signature));

      if (existing.length > 0) {
        processedSignatures.add(signature);
        continue;
      }

      const txInfo = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo || !txInfo.meta) continue;

      const accountKeys = txInfo.transaction.message.accountKeys;
      const accIndex = accountKeys.findIndex((acc: any) => {
        const keyStr = acc.pubkey ? acc.pubkey.toString() : acc.toString();
        return keyStr === depositAddress;
      });

      if (accIndex !== -1) {
        const pre = txInfo.meta.preBalances[accIndex];
        const post = txInfo.meta.postBalances[accIndex];
        const netReceived = post - pre;

        if (netReceived > 0) {
          await processDeposit(db, SOL_PRICE_USD_CENTS, userId, depositAddress, signature, netReceived);
        }
      }

      processedSignatures.add(signature);
    }
  } catch (err) {
    console.error(`Error checking deposit address ${depositAddress}:`, (err as Error).message);
  }
}
