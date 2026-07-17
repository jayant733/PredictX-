import { createLogger } from "../utils/logger.js";
import { FileCache } from "../cache/file-cache.js";

const log = createLogger("llm");

/**
 * Minimal GLM-5.2 chat client (OpenAI-compatible /v1/chat/completions shape).
 * Free tier via Cloudflare AI Gateway / ZCode proxy.
 *
 * Why a custom thin client (not the official SDK)?
 *  - Zero extra deps, smaller surface for the MCP server processes.
 *  - Caching of deterministic prompts is wired in directly to save tokens.
 *
 * Endpoint + key are injected so tests can point at a mock.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Cache key; if set and a hit exists, skips the API call entirely. */
  cacheKey?: string;
}

export interface LlmClient {
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
}

interface GlmConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  cache?: FileCache;
}

export class GlmClient implements LlmClient {
  constructor(private readonly cfg: GlmConfig) {}

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const cacheKey = opts.cacheKey;
    if (cacheKey && this.cfg.cache) {
      const hit = this.cfg.cache.get<string>(cacheKey);
      if (hit !== undefined) {
        log.info("llm cache hit — token saved", { cacheKey });
        return hit;
      }
    }

    const body = {
      model: opts.model ?? this.cfg.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
    };

    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GLM request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const out = data.choices[0]?.message?.content ?? "";

    if (cacheKey && this.cfg.cache) this.cfg.cache.set<string>(cacheKey, out);
    log.info("llm call complete", { model: body.model, chars: out.length });
    return out;
  }
}
