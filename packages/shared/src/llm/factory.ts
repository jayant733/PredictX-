import { getActiveLlm, loadEnv, type Env } from "../config/env.js";
import { GlmClient, type LlmClient } from "./glm-client.js";
import { FileCache } from "../cache/file-cache.js";
import { resolve } from "node:path";

/**
 * Build the active LLM client from env config.
 * - GLM-5.2 is preferred (free via Cloudflare/ZCode proxy).
 * - Gemini is the documented fallback (wired in a later phase if needed).
 *
 * The cache is shared so every caller saves tokens on repeat prompts.
 */

const DEFAULT_GLM_BASE = "https://api.cloudflare.com/client/v4/accounts/.../ai/v1";
const DEFAULT_GLM_MODEL = "glm-5.2";

export interface LlmFactoryResult {
  client: LlmClient;
  provider: "glm" | "gemini";
  model: string;
}

export function createLlm(env: Env = loadEnv(), cache?: FileCache): LlmFactoryResult {
  const active = getActiveLlm(env);
  const sharedCache = cache ?? new FileCache(resolve(process.cwd(), ".cache", "llm"));

  if (active.provider === "glm") {
    const baseUrl = process.env.GLM_BASE_URL ?? DEFAULT_GLM_BASE;
    return {
      provider: "glm",
      model: DEFAULT_GLM_MODEL,
      client: new GlmClient({ apiKey: active.apiKey, baseUrl, defaultModel: DEFAULT_GLM_MODEL, cache: sharedCache }),
    };
  }

  // Gemini fallback — placeholder until Phase 5 needs it.
  throw new Error("Gemini client not implemented yet. Set GLM_API_KEY to use GLM-5.2.");
}
