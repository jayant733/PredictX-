export async function mockChatStream(marketQuestion: string): Promise<ReadableStream> {
  const isBtc = marketQuestion.toLowerCase().includes("bitcoin") || marketQuestion.toLowerCase().includes("btc");
  const mockResponse = `Hello! I am the **PredictX AI Advisor**. 
  
I am currently operating in **Mock Mode** since the \`GEMINI_API_KEY\` is not set in the \`.env\` file. 

However, based on the simulated news contexts and live orderbook data for **"${marketQuestion}"**:
1. Sentiment is leaning strongly towards **${isBtc ? "YES (78% bullish)" : "NO (66% bearish)"}**.
2. Price of YES is currently trading at **${isBtc ? "75¢" : "34¢"}**.
3. Live orderbook suggests a tight bid-ask spread, showing highly liquid trading conditions.
4. Recommended strategy: ${isBtc ? "Buy YES shares on local price dips below 72¢." : "Hedge by scaling into NO positions or holding current YES exposure."}

*Disclaimer: This response is simulated for development and is Not Financial Advice (NFA).*

What other market insights or orderbook statistics can I help you analyze?`;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const words = mockResponse.split(" ");
      for (const word of words) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      controller.close();
    }
  });
}
