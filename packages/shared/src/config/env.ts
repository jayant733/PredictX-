import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

/**
 * Loads .env from the repo root and validates every variable with Zod.
 * Throws a clear error listing every missing/invalid key so misconfig
 * surfaces at boot, not mid-trade.
 */

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // LLM — at least one must be set; resolved via getActiveLlm() below.
  GLM_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Researcher web search
  BRAVE_API_KEY: z.string().optional(),

  // Market data (optional — falls back to local free server)
  POLYGON_API_KEY: z.string().optional(),

  // Push notifications
  PUSHOVER_USER: z.string().optional(),
  PUSHOVER_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/** Walk up from a start dir until a .env file is found (max 5 levels). */
function findEnvFile(startDir: string): string | undefined {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

let cached: Env | undefined;

/** Load + validate env once. Safe to call repeatedly — result is cached. */
export function loadEnv(cwd: string = process.cwd()): Env {
  if (cached) return cached;

  const envPath = findEnvFile(cwd);
  if (envPath) dotenv.parse(readFileSync(envPath, "utf-8"));

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment config:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Which LLM provider should be used? Prefers GLM, falls back to Gemini. */
export function getActiveLlm(env: Env = loadEnv()): {
  provider: "glm" | "gemini";
  apiKey: string;
} {
  if (env.GLM_API_KEY) return { provider: "glm", apiKey: env.GLM_API_KEY };
  if (env.GEMINI_API_KEY) return { provider: "gemini", apiKey: env.GEMINI_API_KEY };
  throw new Error(
    "No LLM key set. Provide GLM_API_KEY or GEMINI_API_KEY in your .env.",
  );
}
