import { generateEmbedding } from "./gemini";
import { getDb, documentChunks } from "@nexus/db";
import { eq, sql } from "drizzle-orm";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_HOST = process.env.PINECONE_HOST || ""; // e.g. "https://your-index-hash.svc.pinecone.io"
const IS_PINECONE_ENABLED = !!(PINECONE_API_KEY && PINECONE_HOST);

if (!IS_PINECONE_ENABLED) {
  console.log("🌲 Pinecone credentials not found. Vector store will use pgvector / Supabase fallback.");
}

export class PineconeStore {
  // Upsert vector to Pinecone
  static async upsert(id: string, values: number[], metadata: any) {
    if (IS_PINECONE_ENABLED) {
      try {
        const response = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
          method: "POST",
          headers: {
            "Api-Key": PINECONE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vectors: [{ id, values, metadata }]
          })
        });
        if (!response.ok) {
          throw new Error(`Pinecone upsert failed: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        console.error("Pinecone upsert failed, falling back:", err);
      }
    }
    // Fallback: pgvector handles embedding inserts in seed script
  }

  // Query similar chunks from Pinecone or pgvector
  static async query(marketId: string, queryText: string, limit = 3): Promise<string[]> {
    if (IS_PINECONE_ENABLED) {
      try {
        const embedding = await generateEmbedding(queryText);
        const response = await fetch(`${PINECONE_HOST}/query`, {
          method: "POST",
          headers: {
            "Api-Key": PINECONE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vector: embedding,
            topK: limit,
            includeMetadata: true,
            filter: { marketId: { "$eq": marketId } }
          })
        });

        if (response.ok) {
          const data = await response.json() as any;
          return data.matches?.map((m: any) => m.metadata?.content || "") || [];
        }
      } catch (err) {
        console.error("Pinecone query failed, falling back to pgvector:", err);
      }
    }

    // Fallback to local pgvector (Supabase)
    const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/nexus";
    
    try {
      const db = getDb(DATABASE_URL);
      const queryEmbedding = await generateEmbedding(queryText);
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      const results = await db
        .select({ content: documentChunks.content })
        .from(documentChunks)
        .where(eq(documentChunks.marketId, marketId))
        .orderBy(sql`${documentChunks.embedding} <=> ${embeddingString}`)
        .limit(limit);

      return results.map(r => r.content);
    } catch (e) {
      console.error("Local pgvector query failed:", e);
      return [];
    }
  }
}
