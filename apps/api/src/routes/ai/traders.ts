import { eq, and, sql, or, inArray } from "drizzle-orm";
import { db, isDbConnected } from "../../db";
import { users, markets, positions, orders, userBotSettings, doubleEntryLedger, transactions, priceHistory } from "@nexus/db";
import { jsonRes } from "../../utils/response";
import { placeLimitOrder, validatePreTrade } from "@nexus/orderbook";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BOT_DEFINITIONS = [
  {
    id: "bot-alice",
    name: "Alice",
    wallet: "5tWEpCFkuDSrXKYfmfYpcAe8qjAhvbFC1B63wuoxM3Vc",
    depositAddress: "7JeaQqrDEVtUxJ9TMDf1HfZDhcyfUbH1pGFWQBc1hRKX",
    strategy: "Momentum scalp trading on trending outcomes",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    risk: "MEDIUM",
    cfModel: "@cf/meta/llama-3-8b-instruct",
  },
  {
    id: "bot-bob",
    name: "Bob",
    wallet: "AF7VbFPH7PfKoFgvTz8wQZhPigLvYyq6ETiT5sQ1aP2x",
    depositAddress: "8n751cnDTuYtk3qnWT7kRkAPjd1hiaxyjzfcyuA9RMEn",
    strategy: "Contrarian plays & sentiment arbitrage based on news",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    risk: "HIGH",
    cfModel: "@cf/mistral/mistral-7b-instruct-v0.2",
  },
  {
    id: "bot-charlie",
    name: "Charlie",
    wallet: "86Sg5J2Hgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc",
    depositAddress: "A54fRTAHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc",
    strategy: "Macro research & fundamental valuation analysis",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    risk: "LOW",
    cfModel: "@cf/meta/llama-3-8b-instruct",
  },
  {
    id: "bot-ed",
    name: "Ed",
    wallet: "98PzRAHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc",
    depositAddress: "B65zTAHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc",
    strategy: "Cross-market reverse-orderbook arbitrage splits",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    risk: "LOW",
    cfModel: "@cf/mistral/mistral-7b-instruct-v0.2",
  }
];

const traderLogs: { timestamp: string; bot: string; message: string }[] = [];
let cycleLogs: { bot: string; message: string }[] = [];

export async function handleGetAiTraders(req: Request, session: any) {
  const userId = session?.id;
  let userSettings: any[] = [];

  if (isDbConnected && userId) {
    userSettings = await db.select().from(userBotSettings).where(eq(userBotSettings.userId, userId));
  }

  const botsData = [];
  for (const bot of BOT_DEFINITIONS) {
    let balanceUsd = 1000000;
    let botPositions: any[] = [];
    let botUserId = bot.id;

    if (isDbConnected) {
      let userRows = await db.select().from(users).where(eq(users.wallet, bot.wallet)).limit(1);
      if (userRows.length === 0) {
        const [inserted] = await db.insert(users).values({
          wallet: bot.wallet,
          balanceUsd: 1000000,
          depositAddress: bot.depositAddress
        }).returning();
        botUserId = inserted.id;
        balanceUsd = inserted.balanceUsd;
      } else {
        botUserId = userRows[0].id;
        balanceUsd = userRows[0].balanceUsd;
      }

      botPositions = await db.select().from(positions).where(eq(positions.userId, botUserId));
    }

    const userSetting = userSettings.find(s => s.botId === bot.id);

    const mappedPositions = [];
    if (isDbConnected && botPositions.length > 0) {
      const marketIds = botPositions.map(p => p.marketId);
      const posMarkets = await db.select().from(markets).where(inArray(markets.id, marketIds));
      const marketMap = new Map(posMarkets.map(m => [m.id, m]));

      for (const p of botPositions) {
        const m = marketMap.get(p.marketId);
        if (m) {
          const currentPrice = p.outcome === 'YES' ? m.yesPrice : m.noPrice;
          const currentProfitCents = (currentPrice - p.averageBuyPrice) * p.quantity;
          const roiPct = p.averageBuyPrice > 0 ? ((currentPrice - p.averageBuyPrice) / p.averageBuyPrice) * 100 : 0;
          mappedPositions.push({
            marketId: p.marketId,
            question: m.question,
            outcome: p.outcome,
            quantity: p.quantity,
            avgBuyPrice: p.averageBuyPrice,
            currentPrice,
            currentProfitCents,
            roiPct
          });
        }
      }
    }

    botsData.push({
      ...bot,
      userId: botUserId,
      balanceUsd: balanceUsd / 100,
      positions: mappedPositions,
      userSetting: userSetting ? {
        enabled: userSetting.enabled,
        allocatedBalanceCents: userSetting.allocatedBalanceCents,
        reservedBalanceCents: userSetting.reservedBalanceCents,
        realizedPnlCents: userSetting.realizedPnlCents,
        unrealizedPnlCents: userSetting.unrealizedPnlCents,
        totalTrades: userSetting.totalTrades,
        winningTrades: userSetting.winningTrades,
        maxDrawdownPercent: userSetting.maxDrawdownPercent,
        dailyLossCents: userSetting.dailyLossCents,
        sharpeRatio: userSetting.sharpeRatio,
        exposureCents: userSetting.exposureCents
      } : {
        enabled: false,
        allocatedBalanceCents: 0,
        reservedBalanceCents: 0,
        realizedPnlCents: 0,
        unrealizedPnlCents: 0,
        totalTrades: 0,
        winningTrades: 0,
        maxDrawdownPercent: 0,
        dailyLossCents: 0,
        sharpeRatio: 0,
        exposureCents: 0
      }
    });
  }

  return jsonRes({
    bots: botsData,
    logs: traderLogs.slice(-100)
  });
}

export async function handleGetAiTradersSettings(req: Request, session: any) {
  if (!isDbConnected) {
    return jsonRes({ settings: [] });
  }
  const userId = session?.id;
  const rows = await db.select().from(userBotSettings).where(eq(userBotSettings.userId, userId));

  const settings = BOT_DEFINITIONS.map(bot => {
    const existing = rows.find(r => r.botId === bot.id);
    return {
      botId: bot.id,
      name: bot.name,
      enabled: existing ? existing.enabled : false,
      allocatedBalanceCents: existing ? existing.allocatedBalanceCents : 0,
      reservedBalanceCents: existing ? existing.reservedBalanceCents : 0,
      realizedPnlCents: existing ? existing.realizedPnlCents : 0,
      unrealizedPnlCents: existing ? existing.unrealizedPnlCents : 0
    };
  });

  return jsonRes({ settings });
}

export async function handlePostAiTradersSettings(req: Request, session: any) {
  if (!isDbConnected) {
    return jsonRes({ error: "Database not connected" }, 500);
  }
  const userId = session?.id;
  const { botId, enabled, allocatedBalanceCents } = await req.json();

  if (!botId) return jsonRes({ error: "Missing botId" }, 400);

  try {
    await db.transaction(async (tx) => {
      const userRows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRows.length === 0) throw new Error("User not found");
      const user = userRows[0];

      const existing = await tx.select().from(userBotSettings)
        .where(and(eq(userBotSettings.userId, userId), eq(userBotSettings.botId, botId))).limit(1);

      const prevAllocated = (existing.length > 0 && existing[0].enabled) ? existing[0].allocatedBalanceCents : 0;
      const newAllocated = enabled ? allocatedBalanceCents : 0;
      const diff = newAllocated - prevAllocated;

      if (diff > 0) {
        if (user.balanceUsd < diff) {
          throw new Error("Insufficient wallet balance to lock allocation.");
        }
        await tx.update(users)
          .set({ balanceUsd: user.balanceUsd - diff })
          .where(eq(users.id, userId));

        // Bookkeeping DEBIT: transfer from wallet to bot
        await tx.insert(doubleEntryLedger).values({
          userId,
          botId,
          transactionType: "ALLOCATION_TRANSFER",
          debitCents: diff,
          creditCents: 0,
          description: `Allocated $${(diff / 100).toFixed(2)} to ${botId}`
        });
      } else if (diff < 0) {
        const refundAmt = Math.abs(diff);
        await tx.update(users)
          .set({ balanceUsd: user.balanceUsd + refundAmt })
          .where(eq(users.id, userId));

        // Bookkeeping CREDIT: transfer back to wallet
        await tx.insert(doubleEntryLedger).values({
          userId,
          botId,
          transactionType: "ALLOCATION_TRANSFER",
          debitCents: 0,
          creditCents: refundAmt,
          description: `Withdrew $${(refundAmt / 100).toFixed(2)} from ${botId}`
        });
      }

      if (existing.length > 0) {
        await tx.update(userBotSettings)
          .set({ enabled, allocatedBalanceCents, updatedAt: new Date() })
          .where(eq(userBotSettings.id, existing[0].id));
      } else {
        await tx.insert(userBotSettings).values({
          userId,
          botId,
          enabled,
          allocatedBalanceCents,
          reservedBalanceCents: 0
        });
      }
    });

    return jsonRes({ success: true });
  } catch (err: any) {
    return jsonRes({ error: err.message || "Failed to update settings" }, 400);
  }
}

export async function handlePostAiTradersCycle(req: Request) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

  let botId: string | null = null;
  try {
    const body = await req.json();
    botId = body.botId || null;
  } catch {}

  cycleLogs = [];

  let activeMarkets: any[] = [];
  if (isDbConnected) {
    activeMarkets = await db.select().from(markets).where(eq(markets.status, "OPEN"));
  }

  if (activeMarkets.length === 0) {
    const msg = "No open markets available for autonomous trading.";
    traderLogs.push({ timestamp: new Date().toISOString(), bot: "System", message: msg });
    return jsonRes({ success: false, logs: [msg] });
  }

  async function runTradingStepForUser(
    bot: typeof BOT_DEFINITIONS[0],
    userId: string,
    balanceUsd: number,
    isBotSelf: boolean,
    userWallet?: string
  ) {
    let botPositions: any[] = [];
    let userSettingRow: any = null;

    if (isDbConnected) {
      botPositions = await db.select().from(positions).where(eq(positions.userId, userId));
      if (!isBotSelf) {
        const rows = await db.select().from(userBotSettings)
          .where(and(eq(userBotSettings.userId, userId), eq(userBotSettings.botId, bot.id))).limit(1);
        userSettingRow = rows[0];
      }
    }

    // 1. RISK MANAGEMENT CHECKS
    if (!isBotSelf && userSettingRow) {
      const totalAllocation = userSettingRow.allocatedBalanceCents + userSettingRow.reservedBalanceCents;
      const dailyLossLimit = Math.round(totalAllocation * 0.10); // 10% daily loss limit
      if (userSettingRow.dailyLossCents >= dailyLossLimit) {
        const riskMsg = `Risk Limit Reached: Bot ${bot.name} daily loss exceeded limit. Halting trading.`;
        traderLogs.push({ timestamp: new Date().toISOString(), bot: bot.name, message: riskMsg });
        return;
      }
    }

    // Profit Taking Mock Logic
    let profitTakingDecision: { market: any; action: "SELL"; outcome: "YES" | "NO"; price: number; quantity: number } | null = null;
    for (const pos of botPositions) {
      if (pos.quantity > 0) {
        const market = activeMarkets.find(m => m.id === pos.marketId);
        if (!market) continue;

        const currentPrice = pos.outcome === "YES" ? market.yesPrice : market.noPrice;
        const avgPrice = pos.averageBuyPrice;
        const profitCentsPerShare = currentPrice - avgPrice;

        if (profitCentsPerShare >= 3 && Math.random() < 0.7) {
          profitTakingDecision = {
            market,
            action: "SELL",
            outcome: pos.outcome as "YES" | "NO",
            price: Math.max(1, currentPrice - 1),
            quantity: pos.quantity
          };
          break;
        }
      }
    }

    let market = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
    let decision: { action: "BUY" | "SELL" | "HOLD"; outcome: "YES" | "NO"; price: number; quantity: number } = {
      action: "HOLD", outcome: "YES", price: 50, quantity: 0
    };

    const targetDisplayName = isBotSelf ? bot.name : `${bot.name} (acting for User ${userWallet ? userWallet.slice(0, 6) : userId.slice(0, 6)})`;

    if (profitTakingDecision) {
      market = profitTakingDecision.market;
      decision = {
        action: "SELL",
        outcome: profitTakingDecision.outcome,
        price: profitTakingDecision.price,
        quantity: profitTakingDecision.quantity
      };
      const profitMsg = `Taking profit on ${decision.outcome} position! Realizing gains...`;
      traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: profitMsg });
      cycleLogs.push({ bot: targetDisplayName, message: profitMsg });
    } else {
      if (balanceUsd < 1000) {
        const msg = `Insufficient balance to perform trade.`;
        traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: msg });
        cycleLogs.push({ bot: targetDisplayName, message: msg });
        return;
      }

      const analyzeMsg = `Analyzing market: "${market.question}"...`;
      traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: analyzeMsg });
      cycleLogs.push({ bot: targetDisplayName, message: analyzeMsg });

      const userPositionsText = botPositions.length > 0 
        ? botPositions.map(p => {
            const m = activeMarkets.find(x => x.id === p.marketId);
            return `- Market: "${m?.question || p.marketId}" | Position: ${p.quantity} shares of ${p.outcome} (Avg Buy: ${p.averageBuyPrice}¢)`;
          }).join("\n")
        : "None";

      const systemPrompt = `You are an autonomous trading bot named ${bot.name}. Strategy: ${bot.strategy}. Risk Profile: ${bot.risk}.
Analyze the market question and your current positions to decide whether to BUY YES/NO, SELL YES/NO, or HOLD.
To take profit or cut losses, you can SELL any YES/NO shares you currently hold. Do NOT SELL shares you do not own.
Response must be valid JSON: { "action": "BUY" | "SELL" | "HOLD", "outcome": "YES" | "NO", "price": number (1 to 99), "quantity": number (1 to 1000) }`;

      const userPrompt = `Market Question: "${market.question}"\nMarket Description: "${market.description}"\nCurrent prices: YES = ${market.yesPrice}¢, NO = ${market.noPrice}¢\nYour available cash: $${(balanceUsd / 100).toFixed(2)} USD.\n\nYour Current Portfolio Positions:\n${userPositionsText}`;

      if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID) {
        try {
          const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${bot.cfModel}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ]
            })
          });
          if (response.ok) {
            const data = await response.json() as any;
            const rawText = data.result?.response || data.result || "";
            decision = JSON.parse(rawText.trim());
          }
        } catch (e) {
          console.error(`${bot.name} Cloudflare AI Worker reasoning failed:`, e);
        }
      } else if (GEMINI_API_KEY) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
          const response = await fetch(url, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }], generationConfig: { responseMimeType: "application/json" } })
          });
          if (response.ok) {
            const data = await response.json() as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            decision = JSON.parse(text.trim());
          }
        } catch (e) {
          console.error(`${bot.name} Gemini reasoning failed:`, e);
        }
      }

      if (decision.action === "HOLD") {
        const rand = Math.random();
        if (rand < 0.6) {
          decision = {
            action: "BUY",
            outcome: Math.random() > 0.5 ? "YES" : "NO",
            price: 50,
            quantity: Math.floor(Math.random() * 80) + 20
          };
          const curPrice = decision.outcome === "YES" ? market.yesPrice : market.noPrice;
          decision.price = Math.min(99, curPrice + 1);
        }
      }

      if (decision.action === "BUY") {
        const targetPrice = decision.outcome === "YES" ? market.yesPrice : market.noPrice;
        decision.price = Math.max(decision.price, Math.min(99, targetPrice + 1));
      }
    }

    if (decision.action === "BUY" || decision.action === "SELL") {
      if (isDbConnected) {
        try {
          const tradeResult = await db.transaction(async (tx) => {
            // Lock user row first
            await tx.select().from(users).where(eq(users.id, userId)).for("update");

            let allocationCents = 0;
            let reservedCents = 0;
            if (!isBotSelf && userSettingRow) {
              allocationCents = userSettingRow.allocatedBalanceCents;
              reservedCents = userSettingRow.reservedBalanceCents;
              
              // Temporarily increase user balance to pass orderbook checks
              await tx.execute(sql`
                UPDATE users 
                SET balance_usd = balance_usd + ${allocationCents} + ${reservedCents}
                WHERE id = ${userId}
              `);
            }

            // Call the Pre-Trade Validation layer inside the transaction
            const validation = await validatePreTrade(tx, userId, market.id, decision);

            if (validation.status === "SKIPPED") {
              // Roll back temporary user balance increase if skipped
              if (!isBotSelf && userSettingRow) {
                await tx.execute(sql`
                  UPDATE users 
                  SET balance_usd = balance_usd - ${allocationCents} - ${reservedCents}
                  WHERE id = ${userId}
                `);
              }
              return { status: "SKIPPED", reason: validation.reason };
            }

            const adjustedQuantity = validation.adjustedQuantity;
            if (adjustedQuantity !== decision.quantity) {
              const notice = `Adjusted order quantity from ${decision.quantity} to ${adjustedQuantity} shares due to validation constraints.`;
              traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: notice });
              cycleLogs.push({ bot: targetDisplayName, message: notice });
            }

            const logTrade = `${decision.action} ${decision.outcome} order decided: ${adjustedQuantity} shares at ${decision.price}¢.`;
            traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: logTrade });
            cycleLogs.push({ bot: targetDisplayName, message: logTrade });

            const result = await placeLimitOrder(tx, userId, market.id, decision.outcome, decision.action, decision.price, adjustedQuantity);

            if (!isBotSelf && userSettingRow) {
              // Double-entry bookkeeping checks
              let newAllocation = allocationCents;
              let newReserved = reservedCents;

              if (decision.action === "BUY") {
                const filledQty = adjustedQuantity - result.remainingQuantity;
                const filledCost = filledQty * decision.price;
                const pendingCost = result.remainingQuantity * decision.price;

                newAllocation = Math.max(0, allocationCents - filledCost - pendingCost);
                newReserved = reservedCents + pendingCost;

                // DEBIT TRADE entry: bot cash converted to holdings/pending
                await tx.insert(doubleEntryLedger).values({
                  userId,
                  botId: bot.id,
                  transactionType: "TRADE_DEBIT",
                  debitCents: filledCost + pendingCost,
                  creditCents: 0,
                  marketId: market.id,
                  orderId: result.orderId,
                  description: `Bought/reserved ${adjustedQuantity} shares of ${decision.outcome}`
                });
              } else if (decision.action === "SELL") {
                const filledQty = adjustedQuantity - result.remainingQuantity;
                const payout = filledQty * decision.price;

                newAllocation = allocationCents + payout;

                // CREDIT TRADE entry: holdings sold, cash returned
                await tx.insert(doubleEntryLedger).values({
                  userId,
                  botId: bot.id,
                  transactionType: "TRADE_CREDIT",
                  debitCents: 0,
                  creditCents: payout,
                  marketId: market.id,
                  orderId: result.orderId,
                  description: `Sold ${filledQty} shares of ${decision.outcome}`
                });

                // Update performance indicators
                const currentPos = botPositions.find(p => p.marketId === market.id && p.outcome === decision.outcome);
                if (currentPos && filledQty > 0) {
                  const profit = (decision.price - currentPos.averageBuyPrice) * filledQty;
                  const winning = profit > 0 ? 1 : 0;

                  await tx.execute(sql`
                    UPDATE user_bot_settings 
                    SET realized_pnl_cents = realized_pnl_cents + ${profit},
                        total_trades = total_trades + 1,
                        winning_trades = winning_trades + ${winning},
                        daily_loss_cents = daily_loss_cents + ${profit < 0 ? Math.abs(profit) : 0}
                    WHERE user_id = ${userId} AND bot_id = ${bot.id}
                  `);
                }
              }

              // Save bot balances
              await tx.update(userBotSettings)
                .set({ 
                  allocatedBalanceCents: newAllocation, 
                  reservedBalanceCents: newReserved 
                })
                .where(eq(userBotSettings.id, userSettingRow.id));

              // Return user balance back to normal minus trades
              await tx.execute(sql`
                UPDATE users 
                SET balance_usd = balance_usd - ${newAllocation} - ${newReserved}
                WHERE id = ${userId}
              `);
            }
            return { status: "SUCCESS", result };
          });

          if (tradeResult.status === "SKIPPED") {
            const skipMsg = `Trade intent skipped. Reason: ${tradeResult.reason}`;
            traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: skipMsg });
            cycleLogs.push({ bot: targetDisplayName, message: skipMsg });
          } else {
            const successMsg = `Trade matched! Status: ${tradeResult.result.status}. Qty: ${tradeResult.result.remainingQuantity}`;
            traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: successMsg });
            cycleLogs.push({ bot: targetDisplayName, message: successMsg });

            if (serverInstance) {
              serverInstance.publish("price-updates", JSON.stringify({
                type: "PORTFOLIO_UPDATE",
                userId,
                botId: bot.id
              }));
            }
          }
        } catch (err: any) {
          const failMsg = `Trade failed: ${err.message || err}`;
          traderLogs.push({ timestamp: new Date().toISOString(), bot: targetDisplayName, message: failMsg });
          cycleLogs.push({ bot: targetDisplayName, message: failMsg });
        }
      }
    }
  }

  for (const bot of BOT_DEFINITIONS) {
    if (botId && bot.id !== botId) continue;

    let botBalance = 1000000;
    let botUserId = bot.id;
    if (isDbConnected) {
      let userRows = await db.select().from(users).where(eq(users.wallet, bot.wallet)).limit(1);
      if (userRows.length === 0) {
        const [inserted] = await db.insert(users).values({
          wallet: bot.wallet,
          balanceUsd: 100000000, // Seed with $1,000,000.00 USD
          depositAddress: bot.depositAddress
        }).returning();
        botUserId = inserted.id;
        botBalance = inserted.balanceUsd;
      } else {
        botUserId = userRows[0].id;
        botBalance = userRows[0].balanceUsd;
      }
    }
    await runTradingStepForUser(bot, botUserId, botBalance, true);

    if (isDbConnected) {
      const userSettings = await db.select().from(userBotSettings)
        .where(and(eq(userBotSettings.botId, bot.id), eq(userBotSettings.enabled, true)));

      for (const setting of userSettings) {
        const [u] = await db.select().from(users).where(eq(users.id, setting.userId)).limit(1);
        if (!u) continue;

        const availableCents = Math.min(setting.allocatedBalanceCents, u.balanceUsd);
        if (availableCents < 100) continue;

        await runTradingStepForUser(bot, setting.userId, availableCents, false, u.wallet);
      }
    }
  }

  return jsonRes({ success: true, logs: cycleLogs });
}

export async function handlePostStopAllAiTraders(req: Request, session: any) {
  if (!isDbConnected) return jsonRes({ success: true });
  const userId = session?.id;

  try {
    await db.transaction(async (tx) => {
      const activeSettings = await tx.select().from(userBotSettings)
        .where(and(eq(userBotSettings.userId, userId), eq(userBotSettings.enabled, true)));

      if (activeSettings.length === 0) return;

      const totalRefund = activeSettings.reduce((sum, row) => sum + row.allocatedBalanceCents + row.reservedBalanceCents, 0);

      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user && totalRefund > 0) {
        await tx.update(users)
          .set({ balanceUsd: user.balanceUsd + totalRefund })
          .where(eq(users.id, userId));
      }

      await tx.update(userBotSettings)
        .set({ enabled: false, allocatedBalanceCents: 0, reservedBalanceCents: 0, realizedPnlCents: 0, unrealizedPnlCents: 0, exposureCents: 0, updatedAt: new Date() })
        .where(eq(userBotSettings.userId, userId));
    });

    return jsonRes({ success: true });
  } catch (err: any) {
    return jsonRes({ error: err.message || "Failed to stop AI trading" }, 400);
  }
}

export async function handleGetAiTradersLedger(req: Request, session: any) {
  if (!isDbConnected) {
    return jsonRes({ ledger: [] });
  }
  const userId = session?.id;
  
  const entries = await db.select()
    .from(doubleEntryLedger)
    .where(eq(doubleEntryLedger.userId, userId))
    .orderBy(doubleEntryLedger.createdAt)
    .limit(100);

  return jsonRes({ ledger: entries });
}

export async function handleGetAiTradersAnalytics(req: Request, session: any) {
  if (!isDbConnected) {
    return jsonRes({ analytics: {} });
  }
  const userId = session?.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return jsonRes({ error: "User not found" }, 404);

  const activeSettings = await db.select().from(userBotSettings)
    .where(eq(userBotSettings.userId, userId));

  const totalAllocated = activeSettings.reduce((sum, row) => sum + (row.enabled ? row.allocatedBalanceCents : 0), 0);
  const totalReserved = activeSettings.reduce((sum, row) => sum + (row.enabled ? row.reservedBalanceCents : 0), 0);
  
  // Fetch user positions to calculate market value of holdings
  const userPositions = await db.select().from(positions).where(eq(positions.userId, userId));
  let marketValue = 0;
  
  if (userPositions.length > 0) {
    const marketIds = [...new Set(userPositions.map(p => p.marketId))];
    const userMarkets = await db.select().from(markets).where(inArray(markets.id, marketIds));
    const marketPriceMap = new Map(userMarkets.map(m => [m.id, m]));

    for (const pos of userPositions) {
      const m = marketPriceMap.get(pos.marketId);
      if (m) {
        const price = pos.outcome === "YES" ? m.yesPrice : m.noPrice;
        marketValue += pos.quantity * price;
      }
    }
  }

  const freeWalletCents = user.balanceUsd;
  const totalEquityCents = freeWalletCents + totalAllocated + totalReserved + marketValue;

  return jsonRes({
    freeWalletCents,
    totalAllocatedCents: totalAllocated,
    totalReservedCents: totalReserved,
    marketValueCents: marketValue,
    totalEquityCents,
    todayPnLCents: activeSettings.reduce((sum, r) => sum + r.realizedPnlCents + r.unrealizedPnlCents, 0),
    dailyLossCents: activeSettings.reduce((sum, r) => sum + r.dailyLossCents, 0)
  });
}
