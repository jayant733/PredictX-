import { GEMINI_API_KEY, IS_MOCK_MODE } from "./client";
import { mockChatStream } from "./mockChatStream";

// RAG Chat Session Streaming
export async function chatSessionStream(
  marketQuestion: string,
  marketDescription: string,
  orderbookContext: string,
  history: { role: "user" | "model"; content: string }[],
  userMessage: string,
  contextChunks: string[]
): Promise<ReadableStream> {
  const contextText = contextChunks.join("\n\n") || "No news context found.";
  
  const systemPrompt = `You are the PredictX AI Advisor, a professional prediction market analyst.
You help users analyze prediction markets. The user is asking a question about:
Market: "${marketQuestion}"
Description: "${marketDescription}"

Here is the live orderbook data for this market:
${orderbookContext}

Here is the retrieved news contexts related to this market:
${contextText}

Use this information to answer the user's question accurately. 
Be helpful, analytical, and objective. 
Make sure to include a clear disclaimer that your response is "Not Financial Advice (NFA)" if you discuss buying YES/NO shares or specific pricing strategies.
Keep your answers formatted in clean markdown, concise, and structured.`;

  // Build API formatted contents list including history
  const contents = [];
  
  // Format history
  for (const turn of history) {
    contents.push({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.content }]
    });
  }
  
  // Add current query
  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  if (IS_MOCK_MODE) {
    return mockChatStream(marketQuestion);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Stream API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    return new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                if (trimmed === "[" || trimmed === "]" || trimmed === ",") continue;
                
                const cleanedJson = trimmed.startsWith(",") ? trimmed.substring(1).trim() : trimmed;
                const parsed = JSON.parse(cleanedJson);
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                   controller.enqueue(encoder.encode(textChunk));
                }
              } catch (e) {
                const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
                let match;
                while ((match = regex.exec(trimmed)) !== null) {
                  try {
                    const unescaped = JSON.parse(`"${match[1]}"`);
                    controller.enqueue(encoder.encode(unescaped));
                  } catch (err) {
                    controller.enqueue(encoder.encode(match[1]));
                  }
                }
              }
            }
          }
          
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim().startsWith(",") ? buffer.trim().substring(1) : buffer.trim());
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch (e) {}
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });
  } catch (err) {
    console.error("Gemini Streaming failed, returning mock stream:", err);
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("Error communicating with Gemini API. Please check server logs. (NFA)"));
        controller.close();
      }
    });
  }
}
