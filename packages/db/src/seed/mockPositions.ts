export const getInitialPositions = (marketMakerId: string, recessionMarketId: string, btcMarketId: string) => [
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "YES",
    quantity: 50000,
    averageBuyPrice: 34
  },
  {
    userId: marketMakerId,
    marketId: recessionMarketId,
    outcome: "NO",
    quantity: 50000,
    averageBuyPrice: 66
  },
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "YES",
    quantity: 50000,
    averageBuyPrice: 75
  },
  {
    userId: marketMakerId,
    marketId: btcMarketId,
    outcome: "NO",
    quantity: 50000,
    averageBuyPrice: 25
  }
];
