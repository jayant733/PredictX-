import { createLogger, FileCache, cacheKeys } from "@autonomous-traders/shared";

const log = createLogger("market:yahoo");

/**
 * Thin fetch wrapper around Yahoo Finance's free quote endpoint.
 * No API key needed. Caches results via FileCache to avoid re-fetching
 * the same ticker within the TTL — saves API calls and tokens.
 *
 * Yahoo Finance v8 quote endpoint (unofficial but stable for sim use):
 *   GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=1d&interval=5m
 *
 * For company info we scrape the v10 endpoint:
 *   GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=assetProfile
 */

const QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const PROFILE_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";

export interface QuoteResult {
  ticker: string;
  price: number;
  currency: string;
  previousClose: number;
  marketCap: number | null;
  volume: number | null;
  source: string;
  fetchedAt: string;
}

export interface CompanyInfo {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  source: string;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        currency: string;
        previousClose: number;
        chartPreviousClose?: number;
      };
      indicators?: { quote?: { volume?: number[] } };
    }>;
  };
}

interface YahooProfileResponse {
  quoteSummary: {
    result: Array<{
      assetProfile: {
        sector: string;
        industry: string;
        longBusinessSummary: string;
      };
      price: { shortName: string };
    }>;
  };
}

export class YahooMarketData {
  constructor(private readonly cache: FileCache) {}

  async getQuote(ticker: string): Promise<QuoteResult> {
    const upper = ticker.toUpperCase();
    const cached = this.cache.get<QuoteResult>(cacheKeys.marketQuote(upper));
    if (cached) {
      log.debug("quote cache hit", { ticker: upper });
      return cached;
    }

    const url = `${QUOTE_URL}/${upper}?range=1d&interval=5m`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo quote fetch failed (${res.status}) for ${upper}`);
    }

    const data = (await res.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) {
      throw new Error(`No price data returned for ${upper}`);
    }

    const volumes = data.chart?.result?.[0]?.indicators?.quote?.volume;
    const nonNullVolumes = (volumes ?? []).filter((v) => v != null);
    const lastVol = nonNullVolumes.length > 0 ? nonNullVolumes[nonNullVolumes.length - 1] : null;

    const result: QuoteResult = {
      ticker: upper,
      price: meta.regularMarketPrice,
      currency: meta.currency ?? "USD",
      previousClose: meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice,
      marketCap: null,
      volume: lastVol,
      source: "yahoo-finance-free",
      fetchedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes — market data is fast-moving but we don't need sub-minute.
    this.cache.set(cacheKeys.marketQuote(upper), result, 300);
    return result;
  }

  async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    const upper = ticker.toUpperCase();
    const url = `${PROFILE_URL}/${upper}?modules=assetProfile`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo profile fetch failed (${res.status}) for ${upper}`);
    }

    const data = (await res.json()) as YahooProfileResponse;
    const profile = data.quoteSummary?.result?.[0];
    if (!profile) throw new Error(`No profile data returned for ${upper}`);

    return {
      ticker: upper,
      name: profile.price?.shortName ?? upper,
      sector: profile.assetProfile?.sector ?? "unknown",
      industry: profile.assetProfile?.industry ?? "unknown",
      description: profile.assetProfile?.longBusinessSummary?.slice(0, 500) ?? "",
      source: "yahoo-finance-free",
    };
  }
}
