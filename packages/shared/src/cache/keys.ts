/**
 * Centralised cache-key builders. Keeps the on-disk filename namespace
 * predictable and collision-free across market data, research, and history.
 *
 * Example: market:quote:AAPL  ->  market__quote__AAPL.json
 */

export const cacheKeys = {
  /** A price quote for a ticker. */
  marketQuote: (ticker: string) => `market:quote:${ticker.toUpperCase()}`,

  /** OHLC history for a ticker over a range. */
  marketHistory: (ticker: string, range: string) =>
    `market:history:${ticker.toUpperCase()}:${range}`,

  /** A researcher web-search result (hashed query). */
  research: (queryHash: string) => `research:${queryHash}`,

  /** Net-worth snapshot series for an account. */
  accountHistory: (accountId: string) => `history:account:${accountId}`,
};

/** Cheap non-crypto hash for research-query keys. */
export function hashKey(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}
