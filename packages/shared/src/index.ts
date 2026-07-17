/**
 * Public surface of @autonomous-traders/shared.
 * Import everything from the package root:
 *   import { loadEnv, createLogger, FileCache } from "@autonomous-traders/shared";
 */

// Domain types
export type {
  Ticker,
  Usd,
  TradeSide,
  RiskProfile,
  Account,
  Holding,
  Trade,
  AccountSnapshot,
} from "./types/domain.js";

// MCP + agent types
export type {
  McpTransport,
  McpServerParams,
  McpServerGroup,
  AgentRole,
  AgentDefinition,
} from "./types/mcp.js";

// Config
export { loadEnv, getActiveLlm, type Env } from "./config/env.js";
export { traderMcpServerParams, researcherMcpServerParams } from "./config/mcp-params.js";

// Logger
export { Logger, createLogger, type LogLevel } from "./utils/logger.js";

// Cache
export { FileCache } from "./cache/file-cache.js";
export { cacheKeys, hashKey } from "./cache/keys.js";

// LLM
export {
  GlmClient,
  type LlmClient,
  type ChatMessage,
  type ChatOptions,
} from "./llm/glm-client.js";
export { createLlm, type LlmFactoryResult } from "./llm/factory.js";
