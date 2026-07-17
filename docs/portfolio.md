# Frontend Specification: Portfolio Page (`portfolio.md`)

This page gives users an overview of their open positions, pending orders, and cash transaction history (deposits/withdrawals).

## 1. Visual Layout
- **Hero Summary (Top)**:
  - Total Portfolio Value: Large bold text (USD).
  - P&L Stats: 24h P&L (absolute + percentage, green/red), and All-Time P&L.
  - Cash Balance vs Assets Balance breakdown.
- **Tabs Selection (Bottom)**:
  - **[ Active Positions ]** (Default)
  - **[ Open Orders ]**
  - **[ Transaction History ]**

---

## 2. Key Components

### A. Active Positions Table
- Columns:
  - **Market**: Title of the market (clickable to navigate to details page).
  - **Outcome**: `YES` or `NO` tag.
  - **Shares**: Number of shares owned.
  - **Avg. Buy Price**: Cost per share when purchased.
  - **Current Price**: Last traded price of the outcome.
  - **Current Value**: `Shares * Current Price`.
  - **Unrealized P&L**: `Current Value - (Shares * Avg. Buy Price)`. Color coded (Green for profit, red for loss).
  - **Action**: "Sell" button which opens a quick-sell modal to place a market/limit sell order.

### B. Open Orders Table
- Lists all active/pending limit orders that haven't been fully filled.
- Columns:
  - **Market**: Clickable market name.
  - **Outcome/Side**: e.g., `Buy YES` or `Sell NO`.
  - **Order Price**: Limit price (e.g. `$0.65`).
  - **Filled / Total Qty**: e.g. `12 / 50` shares.
  - **Total Cost/Value**: `Price * Total Qty`.
  - **Action**: **"Cancel Order"** button. Triggers a database cancel transaction immediately to unlock frozen balances.

### C. Transaction History List
- Lists chronological records of account deposits, withdrawals, splits, and merges.
- Columns:
  - **Date/Time**: Truncated ISO timestamp.
  - **Type**: `Deposit`, `Withdrawal`, `Split`, `Merge`, `Order Fill`.
  - **Amount**: Cash value change (e.g., `+$599.00`, `-$150.00`).
  - **Status**: `Success`, `Pending` (useful for deposits), or `Failed`.
  - **Tx ID / Link**: Clickable link to Solscan/Explorer for blockchain transactions.

---

## 3. Mock APIs & Data Structure

```typescript
interface Position {
  marketId: string;
  marketTitle: string;
  outcome: "YES" | "NO";
  quantity: number;
  averageBuyPrice: number; // 1-99
  currentPrice: number;     // 1-99
}

interface OpenOrder {
  orderId: string;
  marketId: string;
  marketTitle: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  price: number;
  quantity: number;
  filledQuantity: number;
  createdAt: string;
}

interface WalletTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "SPLIT" | "MERGE";
  amountUsd: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  solanaTxSignature?: string;
  createdAt: string;
}
```
