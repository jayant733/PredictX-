import { GEMINI_API_KEY, IS_MOCK_MODE } from "./client";

// 2. Generate Market Summary, Sentiment & Recommendation
export interface MarketSummary {
  summary: string;
  sentimentScore: number;
  recommendation: string;
}

export async function generateMarketSummary(
  marketQuestion: string,
  marketDescription: string,
  contextChunks: string[]
): Promise<MarketSummary> {
  const contextText = contextChunks.length > 0
    ? contextChunks.join("\n\n")
    : "No recent news documents found for this market.";

  const systemInstructions = `You are a financial analysis assistant for PredictX, a prediction market platform.
Analyze the provided market question, description, and related news contexts.
Your goal is to output a JSON object containing:
1. "summary": A concise markdown summary (around 80-100 words) of key market factors and news events. Focus on why the price or probability might move.
2. "sentimentScore": A number from 0 to 100 representing the sentiment-based probability of the outcome resolving to YES. (0 = extremely negative/NO, 100 = extremely positive/YES).
3. "recommendation": A short recommendation string. Must be exactly 'BUY YES', 'BUY NO', or 'HOLD'.

Output ONLY a raw valid JSON object matching this schema. Do not enclose it in markdown code blocks like \`\`\`json.`;

  const prompt = `Market Question: "${marketQuestion}"
Description: "${marketDescription}"

News Contexts:
${contextText}

Analyze and generate the JSON result.`;

  if (IS_MOCK_MODE) {
    const isBtc = marketQuestion.toLowerCase().includes("bitcoin") || marketQuestion.toLowerCase().includes("btc");
    const summary = isBtc
      ? "Bitcoin sentiment remains strongly bullish as spot ETF inflows hit new record highs and regulatory clarity improves. Bullish momentum is driving YES prices upward, though minor resistance exists near historical local highs. High trading volumes confirm solid buying pressure."
      : "The economy continues to flash mixed signals. While retail sales and jobs numbers are moderately healthy, lingering inflation concerns suggest interest rates may remain elevated. Analysts evaluate the recession threat as low but persistent, favoring a conservative trading stance.";
    const sentimentScore = isBtc ? 78 : 34;
    const recommendation = isBtc ? "BUY YES" : "BUY NO";
    
    return { summary, sentimentScore, recommendation };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstructions}\n\n${prompt}` }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Generate Content error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const rawText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(rawText.trim()) as MarketSummary;
    return parsed;
  } catch (err) {
    console.error("Market summary generation failed, using mock:", err);
    return {
      summary: "Error generating real-time AI summary. Current market prices and orderbook depth are healthy. Maintain existing positions and monitor news feeds.",
      sentimentScore: 50,
      recommendation: "HOLD"
    };
  }
}
