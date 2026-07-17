# Frontend Specification: Dashboard Page (`dashboard.md`)

The Dashboard is the landing hub after authentication. It lists active trading markets, categories, trending events, and shows the user's total balance.

## 1. Visual Layout
- **Sidebar**: Collapsible navigation with links to **Explore (Dashboard)**, **Portfolio**, **Leaderboard**, and **Settings**.
- **Header**: Contains:
  - Global Search bar (hotkey `/` focus).
  - Notifications bell (triggers sidebar/dropdown for completed trades or deposit notifications).
  - User wallet summary: Displays connected wallet address (truncated e.g., `5x8F...eR29`), current USD Balance (e.g., `$599.00`), and a "Deposit" / "Withdraw" action button.
- **Main Content**: Grid-based layout for markets with top-level filter tabs (All, IPL, Politics, Crypto, Pop Culture).

## 2. Key Components

### A. Balance Card (Header/Sidebar integration)
- **Design**: Sleek metallic border, subtle glowing USD amount.
- **Fields**:
  - `Cash Balance`: Available USD.
  - `Portfolio Value`: Value of held shares based on last traded price.
  - `Deposit Button`: Triggers a popup displaying the user's personal Solana deposit address with a "Copy Address" and QR code button.
  - `Withdraw Button`: Triggers a modal to input a destination Solana wallet address and withdraw USD.

### B. Category Selector / Filter Tabs
- Horizontal scrolling pill-tabs with active states:
  - active pill: Neon cyan outline and background tint.
  - inactive pill: Semi-transparent dark grey, white text.
- Categories: `🏏 IPL`, `🏛️ Politics`, `🪙 Crypto`, `🍿 Entertainment`.

### C. Market Card (Grid Items)
- Each market card represents a question: (e.g., *"Will BTC touch $200k in 2026?"*).
- **Card Elements**:
  - **Category Icon & Title**: Small tag matching the category (e.g., `Crypto` in blue, `IPL` in green).
  - **Question Text**: Clear, bold typography.
  - **Volume Traded**: Total pool size (e.g., `$234,921 Vol`).
  - **Outcome buttons (YES / NO)**:
    - **YES button**: Displays the current market price (e.g., `Yes 65¢`). On click, opens the trading drawer on the right/bottom.
    - **NO button**: Displays the current market price (e.g., `No 35¢`). On click, opens the trading drawer.
  - **Expiry/End Date**: Countdowns or target date (e.g., `Ends June 30, 2026`).
  - **Mini Sparkline (Optional)**: A micro 5-day price history chart showing price trends inside the card.

### D. Trending Carousel
- Carousel displaying 3-4 featured markets with high trading volumes.
- Features rich banner images or animated indicators (e.g., "High Volatility", "Ending Soon").

---

## 3. Mock APIs & Data Structure
For the frontend developer ("stitch") to wire up:

```typescript
interface Market {
  id: string;
  question: string;
  category: "IPL" | "Politics" | "Crypto" | "Pop Culture";
  yesPrice: number; // 1-99
  noPrice: number;  // 1-99
  volumeUsd: number;
  endTime: string;
  imageUrl?: string;
}

interface UserProfile {
  walletAddress: string;
  balanceUsd: number;
  portfolioValueUsd: number;
}
```
