export const getInitialOrders = (marketMakerId: string, recessionMarketId: string, btcMarketId: string) => [
  // Recession Market YES Order Book
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "SELL" as const,
    price: 36,
    quantity: 4200,
    remainingQuantity: 4200,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "SELL" as const,
    price: 35,
    quantity: 1800,
    remainingQuantity: 1800,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "SELL" as const,
    price: 34,
    quantity: 950,
    remainingQuantity: 950,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "BUY" as const,
    price: 33,
    quantity: 2100,
    remainingQuantity: 2100,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "BUY" as const,
    price: 32,
    quantity: 5600,
    remainingQuantity: 5600,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    side: "BUY" as const,
    price: 31,
    quantity: 12400,
    remainingQuantity: 12400,
    status: "PENDING" as const
  },

  // BTC Market YES Order Book
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "YES",
    side: "SELL" as const,
    price: 77,
    quantity: 2500,
    remainingQuantity: 2500,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "YES",
    side: "SELL" as const,
    price: 76,
    quantity: 3000,
    remainingQuantity: 3000,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "YES",
    side: "BUY" as const,
    price: 74,
    quantity: 1500,
    remainingQuantity: 1500,
    status: "PENDING" as const
  },
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "YES",
    side: "BUY" as const,
    price: 73,
    quantity: 5000,
    remainingQuantity: 5000,
    status: "PENDING" as const
  }
];
