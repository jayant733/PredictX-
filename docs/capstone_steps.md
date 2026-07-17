# Build Steps — Autonomous Traders

A running log of how this repo is built, one small step at a time. The golden rule of this project: **small steps, verify after each, never dump everything at once.**

Project rules (from `architecture.md`):
- TypeScript everywhere (the Python snippets in the spec are translated to TS).
- No file > 150 lines.
- Folder structure must be crystal-clear.
- Free tools only (GLM-5.2 / Gemini, Brave free tier, etc.).
- MCP param for the trader must be built **from scratch**.
- Caching is required for history + token saving.

---

## PHASE 1 — Monorepo scaffold   ✅ (in review)

Goal: stand up an empty but valid Turborepo. No business logic yet — just structure, tooling, and config so every later phase has a home.

### Step 1.1 — Root project files

**Folder:** `/` (repo root)

| File | Logic |
| ---- | ----- |
| `package.json` | Marks this as a **private** monorepo root. Pins `pnpm@10.33.0` and Node ≥20. Defines the turbo scripts: `build`, `dev`, `lint`, `typecheck`, `clean`. Dev deps (turbo, typescript, rimraf, @types/node) live here and are hoisted to all workspaces. |
| `pnpm-workspace.yaml` | Declares **3 workspace globs**: `apps/*` (runnable apps), `packages/*` (shared libs), `servers/*` (MCP servers, each its own process). This is what makes pnpm treat the sub-folders as linked packages. |
| `turbo.json` | Turbo's task graph. `build` depends on `^build` (deps built first), outputs `dist/**`/`build/**`. `dev` is `persistent` (long-running). `globalEnv` whitelists every env var Turbo must track for cache invalidation — so changing `.env` busts the cache. |
| `tsconfig.base.json` | Single source of TS truth. Every package `extends` this. `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` catch bugs early. `module: NodeNext` for clean ESM/CJS interop. |

### Step 1.2 — Repo-wide config

**Folder:** `/` (repo root)

| File | Logic |
| ---- | ----- |
| `.gitignore` | Ignores `node_modules`, build output (`dist`, `build`, `.turbo`), and crucially **`.env`** so no API key ever leaks. Also ignores local `data/` (where the SQLite accounts DB will live). |
| `.env.example` | Template of every secret the project needs, with comments on which are free-tier and where to get them: `GLM_API_KEY`, `GEMINI_API_KEY`, `BRAVE_API_KEY`, `POLYGON_API_KEY` (optional), `PUSHOVER_USER`, `PUSHOVER_TOKEN`. |
| `README.md` | Project overview, architecture diagram, quick-start, and a table of the free services. |

### Step 1.3 — Workspace folder skeletons

Created empty (with `.gitkeep`) so the structure is visible in git from day one:

```
apps/
└── trading-floor/        # (Phase 6) Orchestrator: boots 4 traders + researcher
servers/
├── accounts-server/      # (Phase 3) Synthetic accounts, holdings, trades
├── push-server/          # (Phase 4) Pushover alerts
└── market-server/        # (Phase 4) Free market data (synthetic + yfinance)
packages/
└── shared/               # (Phase 2) Types, config, cache, logger, LLM client
```

No code inside yet — just placeholders. Each gets its `package.json` + `tsconfig.json` + `src/` in its own phase.

### Step 1.4 — What does NOT exist yet (intentional)

- No `pnpm install` run yet (no deps beyond root devDeps to resolve).
- No `src/` anywhere — that's Phase 2+.
- No MCP wiring, no agents, no DB.

---

## PHASE 2 — packages/shared   ✅ (in review)

Goal: a single shared library (`@autonomous-traders/shared`) that every server + agent imports. **Verified:** `pnpm install` ✓, `typecheck` ✓ (0 errors), `build` ✓ (dist emitted). Every file < 150 lines (max 84).

### Step 2.1 — Package scaffolding

**Folder:** `packages/shared/`

| File | Logic |
| ---- | ----- |
| `package.json` | Private package `@autonomous-traders/shared`. ESM (`"type": "module"`). Exports `./dist/index.js` + types. Deps: `dotenv` (load .env), `zod` (validate env). Scripts: build/dev/typecheck/clean. |
| `tsconfig.json` | Extends `../../tsconfig.base.json`. `outDir: dist`, `rootDir: src`, `tsBuildInfoFile` for incremental builds. |

### Step 2.2 — Domain types

**Folder:** `packages/shared/src/types/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `domain.ts` | 58 | Financial domain: `Account`, `Holding`, `Trade`, `AccountSnapshot`, plus primitives `Ticker`, `Usd`, `TradeSide`, `RiskProfile`. Framework-agnostic — no MCP/LLM imports. |
| `mcp.ts` | 35 | MCP + agent wiring: `McpServerParams` (command/args/env, the shape an stdio MCP client consumes), `McpServerGroup`, `AgentRole` (`"trader" \| "researcher"`), `AgentDefinition`. |

### Step 2.3 — Config

**Folder:** `packages/shared/src/config/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `env.ts` | 75 | `loadEnv()` walks up to find `.env`, validates every var with Zod (fails loudly at boot with a list of bad keys). `getActiveLlm()` picks GLM if set, else Gemini. Result cached after first call. |

### Step 2.4 — Logger

**Folder:** `packages/shared/src/utils/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `logger.ts` | 49 | `createLogger("namespace")` → colorised, ISO-timestamped console logger with `debug/info/warn/error`. `LOG_LEVEL` env controls verbosity. Zero deps (keeps MCP processes lean). |

### Step 2.5 — Cache (history + token saving)

**Folder:** `packages/shared/src/cache/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `file-cache.ts` | 76 | `FileCache` — one JSON file per key under a root dir. TTL support (`set(key, val, ttlSeconds)`; 0 = never). Used for market quotes, research results, snapshots → **saves API calls + tokens** on repeat work. |
| `keys.ts` | 30 | `cacheKeys.*` builders (`marketQuote`, `marketHistory`, `research`, `accountHistory`) so the on-disk namespace stays collision-free. `hashKey()` for query strings. |

### Step 2.6 — LLM client

**Folder:** `packages/shared/src/llm/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `glm-client.ts` | 84 | `GlmClient` — thin `fetch`-based GLM-5.2 chat client (OpenAI-compatible `/chat/completions`). **Cache wired in**: pass `cacheKey` in options and a hit skips the API call entirely (token saved). Zero SDK dep. |
| `factory.ts` | 38 | `createLlm(env, cache?)` — picks GLM by default, throws a clear error if no key / Gemini not yet implemented. Shares one cache dir across callers. |

### Step 2.7 — Barrel export

**Folder:** `packages/shared/src/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `index.ts` | 45 | Single public surface. Every consumer imports from `@autonomous-traders/shared`. |

### Step 2.8 — What does NOT exist yet

- No actual MCP server processes (Phase 3–4).
- Gemini client is a stub (GLM is the primary; Gemini only if you switch).
- No agents yet (Phase 5).
- `.env` is still empty — **you'll provide the keys**; the loader already knows how to read them.

## PHASE 3 — servers/accounts-server   ✅ (in review)

Goal: the home-made **Accounts MCP server** — synthetic accounts, holdings, and an append-only trade ledger, spoken over stdio. **Verified:** `pnpm install` ✓ (incl. native `better-sqlite3` build), `typecheck` ✓ (0 errors), `build` ✓, **end-to-end smoke test ✓** (initialize → tools/list → open_account → list_accounts all working), **cash-invariant test ✓** (a $10k trade against $1k cash correctly rejected). Every file < 150 lines (max 113).

### Step 3.1 — Package scaffolding

**Folder:** `servers/accounts-server/`

| File | Logic |
| ---- | ----- |
| `package.json` | Private pkg `@autonomous-traders/accounts-server`. ESM. Deps: `@modelcontextprotocol/sdk` (MCP), `better-sqlite3` (ledger), `zod` + `zod-to-json-schema` (input validation → tool schema), `@autonomous-traders/shared` (workspace). `bin.accounts-server` exposes it as a runnable process. |
| `tsconfig.json` | Extends base config; `outDir/rootDir: dist/src`. |

### Step 3.2 — Persistence

**Folder:** `servers/accounts-server/src/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `schema-sql.ts` | 60 | The DDL for the 3 tables (`accounts`, `holdings`, `trades`) + indexes. Also exports the `OpenAccountInput` / `RecordTradeInput` interfaces. Split out so `db.ts` stays focused on queries. |
| `db.ts` | 113 | `AccountsRepository` — wraps `better-sqlite3`. WAL mode for concurrency. CRUD for accounts/holdings, `recordTrade` (append-only), `setCash`. All prepared statements; returns domain types via row mappers. |
| `rows.ts` | 44 | snake_case → camelCase row mappers. The single `any`-typed boundary that trusts our own column names. |

### Step 3.3 — Business rules

**Folder:** `servers/accounts-server/src/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `trading.ts` | 105 | `TradingService.execute()` — enforces the invariants: BUY needs enough cash (debits cash, recalculates avg-cost, upserts holding); SELL needs enough shares (credits cash, deletes holding if fully closed). Each trade is appended to the ledger. **The** logic that protects the synthetic account from impossible states. |

### Step 3.4 — MCP surface

**Folder:** `servers/accounts-server/src/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `schemas.ts` | 50 | Zod input schemas for all 7 tools. `describe()` strings double as the prompt the LLM reads to decide when to call each tool. |
| `handlers.ts` | 72 | Thin handlers: parse args with Zod → call repo/trading → return JSON. No business logic here; kept testable. |
| `tools.ts` | 71 | `buildToolRegistry()` — pairs each Zod schema (→ JSON Schema via `zod-to-json-schema`) with its handler. Single source of truth for what the server advertises. |
| `index.ts` | 70 | Bootstrap. Builds repo → trading → handlers → registry, wires the MCP SDK `Server`, handles `tools/list` + `tools/call`, connects `StdioServerTransport`. Tool errors are caught and returned as `{ isError: true }` (never thrown into the transport). |

### Step 3.5 — Smoke test

**Folder:** `servers/accounts-server/scripts/`

| File | Logic |
| ---- | ----- |
| `smoke.js` | Drives the server over stdio like a real MCP client: initialize → initialized → tools/list → open_account → list_accounts. Confirms the full transport → SDK → handlers → SQLite chain works. |

### Step 3.6 — Bug found & fixed during testing

The shared `logger.ts` was writing to **stdout**, which corrupts MCP stdio JSON-RPC. **Fixed:** logger now always writes to `stderr`. Project-wide invariant to remember: *MCP stdio servers must reserve stdout for JSON-RPC only.*

## PHASE 4 — servers/push-server + servers/market-server + MCP wiring   ✅ (in review)

Goal: build the two remaining home-made MCP servers (push + market) and the central MCP wiring config that the orchestrator will use. **Verified:** all 4 packages build ✓, push-server smoke test ✓, market-server smoke test ✓ (real AAPL price from Yahoo Finance).

### What the Python spec revealed (changed the plan)

From the Python snippets you provided:

1. **`mcp-memory-libsql`** — a per-agent persistent memory server (knowledge graph). Was not in the original plan. Each agent gets its own SQLite DB file under `data/memory/{name}.db`. This is how traders share knowledge.
2. **Trader prompt references specific tools**: `get_last_trade`, `get_share_price`, `get_snapshot_ticker`. Our free `market-server` exposes `get_share_price` + `get_company_info`. If a Polygon key is provided, the Polygon MCP server replaces it.
3. **3 MCP servers per trader**: accounts-server, push-server, market-server.
4. **3 MCP servers per researcher**: fetch, brave-search, memory (named per agent).

### Step 4a — push-server (Pushover alerts)

**Folder:** `servers/push-server/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `package.json` | — | ESM. Deps: MCP SDK, zod, zod-to-json-schema. |
| `tsconfig.json` | — | Standard extends-base config. |
| `src/push.ts` | 55 | `sendPush(message, title?)` — calls Pushover REST API. If no creds set (dev mode), logs locally instead of crashing. |
| `src/index.ts` | 77 | MCP bootstrap. **1 tool**: `push` — send a push notification. Schema: message (required, max 1024 chars), title (optional). |

Smoke test: `push` call → `"sent": false, "logged locally (no Pushover credentials)"` ✓

### Step 4b — market-server (free Yahoo Finance data)

**Folder:** `servers/market-server/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `package.json` | — | ESM. Deps: MCP SDK, zod, zod-to-json-schema, @autonomous-traders/shared (for cache). |
| `tsconfig.json` | — | Standard extends-base config. |
| `src/yahoo.ts` | 142 | `YahooMarketData` class — fetches from Yahoo Finance v8 chart + v10 profile endpoints (no API key). `getQuote(ticker)` returns price, currency, previous close, volume. `getCompanyInfo(ticker)` returns name, sector, industry, description. Both cached via `FileCache` (quotes: 5 min TTL). |
| `src/index.ts` | 102 | MCP bootstrap. **2 tools**: `get_share_price` (free EOD/delayed data), `get_company_info` (fundamental analysis). |

Smoke test: `get_share_price("AAPL")` → real price $297.01 from Yahoo Finance ✓

### Step 4c — MCP wiring config

**Folder:** `packages/shared/src/config/`

| File | Lines | Logic |
| ---- | ----- | ----- |
| `mcp-params.ts` | 102 | `traderMcpServerParams(env)` → `[accounts-server, push-server, market-server]`. `researcherMcpServerParams(name, env)` → `[fetch, brave-search, memory(name)]`. Each returns `McpServerParams[]`. If `POLYGON_API_KEY` is set, the Polygon npx server replaces our home-made market-server. Memory DB path: `file:./data/memory/{agentName}.db`. |

**Also updated:** `.env.example` — added `LIBSQL_BASE_URL` for the memory server.

### Full MCP server inventory (6 total)

| # | Server | Command | Tools | For |
|---|--------|---------|-------|-----|
| 1 | accounts-server | `node dist/index.js` (home-made) | 7 | trader |
| 2 | push-server | `node dist/index.js` (home-made) | 1 | trader |
| 3 | market-server | `node dist/index.js` (home-made, free) | 2 | trader |
| 4 | mcp-server-fetch | `npx @anthropic-ai/mcp-server-fetch` | ~3 | researcher |
| 5 | server-brave-search | `npx @modelcontextprotocol/server-brave-search` | ~2 | researcher |
| 6 | mcp-memory-libsql | `npx mcp-memory-libsql` | ~5 | trader + researcher |

### What does NOT exist yet

- No agents yet (Phase 5).
- No orchestrator (Phase 6).
- Polygon integration is a stub (just the wiring — the Polygon npx package is external).

## PHASE 5 — researcher-agent + trader-agent + prompts   ⏳ (pending your go-ahead)

## PHASE 6 — apps/trading-floor orchestrator   ⏳
