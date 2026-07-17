# PredictX: Autonomous Traders & Decentralized-Hybrid Prediction Market Monorepo

PredictX is a high-performance, decentralized-hybrid prediction market platform integrated with autonomous AI trading agents (4 Traders + 1 Researcher) operating within the Solana ecosystem. 

---

## 🎯 Project Motive & Core Vision

Traditional automated market makers (AMMs) suffer from high on-chain transaction costs, latency, and slippage. PredictX solves this by utilizing a **hybrid custodial architecture**:
- **Speed & UX:** Trades match off-chain instantaneously with zero gas fees using a high-throughput matching engine.
- **Security & Settlement:** Deposits, custody, and withdrawals are secured directly on the Solana blockchain.
- **Autonomous Agents:** Features independent AI traders that analyze markets, execute strategies, communicate research findings, and update state using a custom Model Context Protocol (MCP) framework.

---

## 🏗️ System Architecture & Layout

PredictX is organized as a unified Turborepo monorepo running under Bun:

```text
prediction-market/
├── apps/
│   ├── api/                 # Bun HTTP REST API (Web3 Auth & Trade execution)
│   ├── indexer/             # Solana indexer daemon (polls blockchain deposits)
│   └── trading-floor/       # AI trading floor coordinator
├── packages/
│   ├── db/                  # Drizzle schemas, migrations, connection pools
│   ├── orderbook/           # Core matching engine & pessimistic locks
│   └── shared/              # Shared types, logger, file cache, LLM config
└── servers/
    ├── accounts-server/     # Custom Accounts MCP server (synthetic portfolio tracking)
    ├── market-server/       # Yahoo Finance quotes MCP server
    └── push-server/         # Pushover notifications MCP server
```

### High-Level Data Flow

```mermaid
graph TD
    User[User / Web Browser] -->|Web3 Wallet Signature| API[Bun REST API]
    API -->|Authenticate & Issue JWT| User
    User -->|Place Order / Trade| API
    API -->|Validate & Match| Engine[Orderbook Matching Engine]
    Engine -->|Acquire Locks| DB[(PostgreSQL / Supabase)]
    Engine -->|Update Positions & Balances| DB
    
    Solana[Solana Blockchain] -->|Incoming Tx| Indexer[Solana Indexer]
    Indexer -->|Credit Balance| DB
```

---

## 📈 Orderbook Cross-Matching Rules

Every prediction market consists of complementary **YES** and **NO** shares where $Price(YES) + Price(NO) = \$1.00$ (100¢). PredictX handles two types of matching workflows:

- **Direct Match:** Matches buyers with sellers on the same share type (e.g., `BUY YES` matches resting `SELL YES` at or below the limit price).
- **Cross-Market Match (Reverse Orderbook):** Matches opposites (e.g., `BUY YES` matches a resting `BUY NO` when $Price(YES) + Price(NO) \ge 100$). The system takes capital from both, mints new YES/NO pairs, and distributes them.
- **Split & Merge:** Arbitrary minting of YES/NO pairs from $1.00 cash (Split) or burning matched YES/NO pairs back into $1.00 cash (Merge).

---

## 🛡️ Concurrency Control & Concurrency Invariants

To avoid double spending or race conditions during rapid trading, PredictX implements strict row-level locking:
1. **Deterministic Market Locking:** Acquires a row lock on the target market using `SELECT ... FOR UPDATE` before updating the matching engine queue to prevent deadlocks.
2. **Double Spend Protection:** Locks user balance rows before committing any debit/credit actions.

---

## 🤖 Autonomous Trading Floor (MCP Integration)

The trading simulation consists of:
- **4 Traders (e.g., Ed, etc.):** Each manages their portfolio based on individual strategy configurations, executing trades on the synthetic accounts server.
- **1 Researcher:** Queries the web via headless browser fetch tools, analyzes news, and pushes market opportunities to the traders.

### MCP Server Inventory

| # | MCP Server | Command | Purpose |
|---|------------|---------|---------|
| 1 | accounts-server | `node dist/index.js` | Synthetic holdings, account ledger |
| 2 | push-server | `node dist/index.js` | Dispatch Pushover mobile alerts |
| 3 | market-server | `node dist/index.js` | Cache & serve Yahoo Finance data |
| 4 | mcp-server-fetch | `npx @anthropic-ai/mcp-server-fetch` | Headless Web page rendering |
| 5 | server-brave-search | `npx @modelcontextprotocol/server-brave-search` | Brave Web Search integration |
| 6 | mcp-memory-libsql | `npx mcp-memory-libsql` | Shared persistent knowledge graph |

---

## ⚙️ Quick Start & Setup

### 1. Install dependencies
```bash
bun install
```

### 2. Configure environment
Create a root `.env` file referencing `.env.example.capstone`:
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/nexus"
JWT_SECRET="your-supabase-jwt-secret-minimum-32-chars-long"
ENCRYPTION_SECRET="your-encryption-key-for-deposit-wallets"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 3. Run migrations and database seed
```bash
cd packages/db
bun run db:push
bun run db:seed
```

### 4. Boot dev servers (REST API & Indexer)
```bash
bun run dev
```
