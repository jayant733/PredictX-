# Frontend Specification: Market Detail Page (`market-detail.md`)

This is the primary trading page for a specific market. It displays the interactive price chart, the orderbooks (bids/asks), the trading panel (Limit, Market, Splits, Merges), and the market resolution rules.

## 1. Visual Layout (3-Column Layout)
- **Left Column / Center (60%)**:
  - Breadcrumbs & Category info.
  - Full Question Heading (e.g. *"Will BJP win more than 300 seats in the next general election?"*).
  - **Interactive Price Chart**: Interactive area with timeline toggles (5D, 14D, 1M, 1Y).
  - **About the Market & Resolution Rules**: Collapsible accordion detailing how the market is resolved, source of truth, and end conditions.
- **Middle Column (20%)**:
  - **Real-Time Orderbook**: Orderbook depths for YES and NO markets (Bids & Asks).
- **Right Column (20%)**:
  - **Trading Control Center**: Panels for placing orders (Buy/Sell YES/NO, Limit/Market) and Split/Merge controls.

---

## 2. Key Components

### A. Price History Chart
- **Tech Recommendation**: Recharts, Chart.js, or lightweight-charts (TradingView).
- **Features**:
  - Toggle between **YES price** and **NO price** view.
  - Hover tooltip showing the exact price (in cents, e.g., `$0.62`), timestamp, and 24h volume.
  - **Timeline Pill Buttons**: `5 Days`, `14 Days`, `1 Month`, `1 Year`. Updates chart dataset.

### B. Real-Time Orderbook
- Separated tabs for **YES Orderbook** and **NO Orderbook**.
- **Visuals**:
  - **Asks (Sells)**: Rendered on top in red. Columns: `Price ($)`, `Qty`, `Accumulated Size`. Progress bars showing cumulative size.
  - **Spread**: Center bar showing current spread (e.g., `Spread: $0.02`).
  - **Bids (Buys)**: Rendered on bottom in green. Columns: `Price ($)`, `Qty`, `Accumulated Size`.
- Clicking on a price row inside the orderbook auto-fills the price input in the Trading Control Center.

### C. Trading Control Center (Order Placement)
Tabbed interface: **[ Trade ]** and **[ Mint / Redeem (Split/Merge) ]**.

#### Trade Tab:
- **Outcome Switcher**: Large toggle buttons for `YES` (Green active state) and `NO` (Red active state).
- **Side Switcher**: Toggle between `BUY` (default) and `SELL`.
- **Order Type Selector**: Toggle between `Limit` and `Market` orders.
- **Price Input (Only for Limit Orders)**: Slider or input field ranging from `$0.01` to `$0.99`.
- **Quantity Input**: Number of shares to buy/sell.
- **Trade Summary Box**:
  - `Average Price`: Selected price.
  - `Total Cost`: `Price * Quantity`.
  - `Max Payout`: `Quantity * $1.00`.
  - `Max Profit`: `Max Payout - Total Cost`.
  - `Estimated Slippage` (Only for Market orders).
- **Submit Button**: Large call to action (e.g. `Buy YES shares`).

#### Mint / Redeem (Split & Merge) Tab:
- **Split Panel**:
  - Input: `Cash Amount ($)`.
  - Output display: `Get X YES shares + X NO shares`.
  - Action button: `Split Capital` (deducts cash, adds YES and NO shares to user).
- **Merge Panel**:
  - Input: `Quantity of Pairs`.
  - Balance verification: Check if user owns at least `Quantity` of YES shares and `Quantity` of NO shares.
  - Output display: `Receive X USD Cash`.
  - Action button: `Merge Shares` (destroys shares, adds cash).

---

## 3. Mock APIs & Data Structure

### Orderbook Schema
```typescript
interface OrderBookLevel {
  price: number; // 1-99
  quantity: number;
}

interface OrderBook {
  yes: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
  no: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
}
```

### Price History Schema
```typescript
interface HistoricalPricePoint {
  timestamp: string; // ISO 8601
  yesPrice: number;  // 1-99
  noPrice: number;   // 1-99
  volumeUsd: number;
}
```
