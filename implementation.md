# PredictX Implementation Plan

PredictX is a hybrid prediction market platform built for the Solana ecosystem, integrating a high-performance matching engine and autonomous AI trading agents.

## Implementation Phases

### Phase 1: Repository Architecture & Core Tooling
- Initialize a private Turborepo monorepo using Bun.
- Set up root-level configurations: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and base `tsconfig.json`.
- Configure environment defaults via `.env.example`.

### Phase 2: Shared Library (`@autonomous-traders/shared`)
- Define domain models: account structures, trades, portfolios, and risk profiles.
- Implement shared configurations (environment validators using Zod).
- Build a generic caching layer for token saving and market history.
- Implement API clients for LLMs (GLM-5.2 and Gemini compatibility).

### Phase 3: Database Layer (PostgreSQL & Drizzle ORM)
- Design the Drizzle database schema (`users`, `markets`, `orders`, `positions`, `transactions`, `priceHistory`).
- Implement connection pooling and migrations runner.
- Create seed scripts for populating development databases with mock events (Politics, Crypto, Sports).

### Phase 4: Orderbook Matching Engine
- Build the core matching engine in `packages/orderbook`.
- Support direct matches (`BUY YES` vs. `SELL YES`) and cross-market matches (`BUY YES` vs. `BUY NO`).
- Implement split/merge logic to handle shares minting and redemption.
- Prevent race conditions using PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).

### Phase 5: Custom MCP Servers
- **Accounts Server:** Manage synthetic accounts, portfolios, and ledger tracking over stdio.
- **Push Server:** Trigger Pushover mobile notifications for trade alerts and research findings.
- **Market Server:** Fetch free real-time and delayed market quotes using Yahoo Finance.

### Phase 6: Solana Deposit Indexer Daemon
- Listen to Solana blockchain events (Helius webhooks and connection polls).
- Automate account creation and generate individual deposit wallet keypairs.
- Credit internal USD balances when users transfer funds on-chain.

### Phase 7: REST API Server & Web Interface
- Build high-throughput REST API using `Bun.serve()`.
- Implement signature-based Web3 authentication using Solana wallets.
- Expose endpoints for orderbook placement, account tracking, and AI insights.
