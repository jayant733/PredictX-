export const enrichPositions = (posData: any[], marketsData: any[]) => {
  return posData.map((pos: any) => {
    const market = marketsData.find((m: any) => m.id === pos.marketId);
    const marketTitle = market ? market.question : pos.marketId;
    const category = market ? market.category : 'Unknown';
    const currentPrice = market ? (pos.outcome === 'YES' ? market.yesPrice : market.noPrice) : 50;
    
    const currentValue = (pos.quantity * currentPrice) / 100;
    const costBasis = (pos.quantity * pos.averageBuyPrice) / 100;
    const unrealizedPnL = currentValue - costBasis;
    const unrealizedPnLPercentage = costBasis > 0 ? Math.round((unrealizedPnL / costBasis) * 100) : 0;
    
    const icon = category.toLowerCase() === 'crypto' ? 'currency_bitcoin' : 
                 category.toLowerCase() === 'sports' ? 'sports_soccer' : 'gavel';
    
    return {
      id: pos.id,
      marketId: pos.marketId,
      marketTitle,
      category: category.toUpperCase(),
      outcome: pos.outcome,
      shares: pos.quantity,
      avgBuy: pos.averageBuyPrice / 100,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercentage,
      isPositive: unrealizedPnL >= 0,
      icon,
      endDate: market ? new Date(market.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
    };
  });
};

export const enrichPendingOrders = (histData: any[], marketsData: any[]) => {
  const pending = histData.filter((o: any) => o.status === 'PENDING' || o.status === 'PARTIALLY_FILLED');
  return pending.map((o: any) => {
    const market = marketsData.find((m: any) => m.id === o.marketId);
    return {
      id: o.id,
      marketTitle: market ? market.question : o.marketId,
      side: `${o.side} ${o.outcome}`,
      price: o.price / 100,
      filledShares: o.quantity - o.remainingQuantity,
      totalShares: o.quantity,
      value: (o.remainingQuantity * o.price) / 100
    };
  });
};

export const enrichTransactionHistory = (histData: any[], marketsData: any[]) => {
  return histData.map((h: any) => {
    const isBuy = h.side === 'BUY' || h.type === 'TRADE_BUY' || h.amountUsd < 0;
    const qty = h.quantity || h.details?.quantity || 0;
    const price = h.price || h.details?.price || 50;
    const market = marketsData.find((m: any) => m.id === h.marketId);
    const marketTitle = market ? market.question : (h.details?.marketId || 'Nexus Trade');
    return {
      id: h.id,
      date: new Date(h.createdAt).toLocaleString(),
      type: `${isBuy ? 'TRADE BUY' : 'TRADE SELL'} - ${marketTitle}`,
      amount: `${isBuy ? '-' : '+'}$${((qty * price) / 100).toFixed(2)}`,
      isPositive: !isBuy,
      status: h.status || 'FILLED',
      txId: h.id.slice(0, 8).toUpperCase()
    };
  });
};

export const formatCurrency = (val: number) => {
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
