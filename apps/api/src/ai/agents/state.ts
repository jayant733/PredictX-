export const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const IS_MOCK_GEMINI = !GEMINI_API_KEY;

// 1. Define State Graph Interface
export interface AgentState {
  query: string;
  marketId: string;
  steps: string[]; // Telemetry tracking (e.g. "News Agent complete")
  newsData?: string;
  twitterData?: string;
  cryptoData?: string;
  marketData?: string;
  summary?: {
    bullet1: string;
    bullet2: string;
    bullet3: string;
    fullReport: string;
  };
}

// 2. Tavily Search Client Helper
export async function searchTavily(query: string): Promise<string> {
  if (!TAVILY_API_KEY) {
    throw new Error("Tavily API key missing");
  }
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        max_results: 3
      })
    });
    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }
    const data = await response.json() as any;
    return data.results?.map((r: any) => `Title: ${r.title}\nContent: ${r.content}`).join("\n\n") || "No Tavily search results.";
  } catch (err) {
    console.error("Tavily query failed, falling back:", err);
    throw err;
  }
}
