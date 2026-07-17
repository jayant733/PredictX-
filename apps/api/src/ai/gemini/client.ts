export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const IS_MOCK_MODE = !GEMINI_API_KEY;

if (IS_MOCK_MODE) {
  console.warn("⚠️ GEMINI_API_KEY is not set. PredictX AI is running in MOCK mode.");
}

// 1. Generate Embeddings (768 dimensions for text-embedding-004)
export async function generateEmbedding(text: string): Promise<number[]> {
  if (IS_MOCK_MODE) {
    // Return a dummy 768-dimensional normalized vector
    const vector = Array.from({ length: 768 }, (_, i) => Math.sin(i * 0.1) * (i % 2 === 0 ? 1 : -1));
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data.embedding.values;
  } catch (err) {
    console.error("Embedding generation failed, falling back to mock:", err);
    // Fallback vector
    const vector = Array.from({ length: 768 }, (_, i) => Math.cos(i * 0.1));
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
}
