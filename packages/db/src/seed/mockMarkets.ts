export interface MarketSeed {
  question: string;
  category: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volumeUsd: number;
  status: "OPEN" | "CLOSED" | "RESOLVED";
}

export const initialMarkets: MarketSeed[] = [
  {
    question: "Will the US enter a recession in 2024?",
    category: "Politics",
    description: "This market resolves to 'YES' if the National Bureau of Economic Research (NBER) declares a recession in 2024.",
    yesPrice: 34,
    noPrice: 66,
    volumeUsd: 4200000,
    status: "OPEN"
  },
  {
    question: "Will Bitcoin reach $100k by December?",
    category: "Crypto",
    description: "Resolves to 'YES' if BTC/USD trades above $100,000 on Binance before December 31st.",
    yesPrice: 75,
    noPrice: 25,
    volumeUsd: 15600000,
    status: "OPEN"
  },
  {
    question: "Will Nvidia's market cap exceed $4 trillion?",
    category: "Stocks",
    description: "Resolves to 'YES' if NVDA market cap exceeds $4T at any point on public markets.",
    yesPrice: 60,
    noPrice: 40,
    volumeUsd: 9800000,
    status: "OPEN"
  },
  {
    question: "Will Apple announce an AI-powered smart glasses product this year?",
    category: "Stocks",
    description: "Resolves to 'YES' if Apple officially launches or announces AR smart glasses during its keynotes.",
    yesPrice: 45,
    noPrice: 55,
    volumeUsd: 3400000,
    status: "OPEN"
  },
  {
    question: "Will Tesla release Full Self-Driving (FSD) in Europe this quarter?",
    category: "Stocks",
    description: "Resolves to 'YES' if European regulators approve and Tesla rolls out FSD to public European vehicles.",
    yesPrice: 25,
    noPrice: 75,
    volumeUsd: 5800000,
    status: "OPEN"
  },
  {
    question: "Will Microsoft acquire another gaming publisher valued over $5 billion?",
    category: "Stocks",
    description: "Resolves to 'YES' if Microsoft announces an agreement to acquire a gaming publisher for $5B+.",
    yesPrice: 15,
    noPrice: 85,
    volumeUsd: 1200000,
    status: "OPEN"
  },
  {
    question: "Will Google spin off the Chrome browser or Android OS due to antitrust ruling?",
    category: "Stocks",
    description: "Resolves to 'YES' if Google officially announces a structural spin-off of Chrome or Android.",
    yesPrice: 20,
    noPrice: 80,
    volumeUsd: 4600000,
    status: "OPEN"
  },
  {
    question: "Will Amazon deploy autonomous delivery drones in 5 new US cities?",
    category: "Stocks",
    description: "Resolves to 'YES' if Amazon Prime Air launches drone deliveries in at least 5 new US cities.",
    yesPrice: 55,
    noPrice: 45,
    volumeUsd: 2200000,
    status: "OPEN"
  },
  {
    question: "Will Meta release Llama 5 before the end of the year?",
    category: "Stocks",
    description: "Resolves to 'YES' if Meta Platforms publicly releases the weights or API for Llama 5.",
    yesPrice: 30,
    noPrice: 70,
    volumeUsd: 6100000,
    status: "OPEN"
  },
  {
    question: "Will SpaceX launch Starship on a fully commercial flight payload by December?",
    category: "Stocks",
    description: "Resolves to 'YES' if Starship deploys operational commercial payloads into orbit.",
    yesPrice: 65,
    noPrice: 35,
    volumeUsd: 8700000,
    status: "OPEN"
  },
  {
    question: "Will Brent Crude oil price cross $100 per barrel?",
    category: "Commodities",
    description: "Resolves to 'YES' if Brent Crude spot prices trade above $100 on the ICE exchange.",
    yesPrice: 40,
    noPrice: 60,
    volumeUsd: 5400000,
    status: "OPEN"
  },
  {
    question: "Will Netflix stock trade above $800 per share?",
    category: "Stocks",
    description: "Resolves to 'YES' if NFLX closes above $800 on any trading day.",
    yesPrice: 50,
    noPrice: 50,
    volumeUsd: 3100000,
    status: "OPEN"
  },
  {
    question: "Will AMD capture over 35% of the x86 server CPU market share?",
    category: "Stocks",
    description: "Resolves to 'YES' if Mercury Research reports AMD server market share over 35%.",
    yesPrice: 70,
    noPrice: 30,
    volumeUsd: 4100000,
    status: "OPEN"
  },
  {
    question: "Will Disney announce a brand new Star Wars trilogy with a new director?",
    category: "Stocks",
    description: "Resolves to 'YES' if Disney press releases announce a new theatrical Star Wars trilogy.",
    yesPrice: 35,
    noPrice: 65,
    volumeUsd: 1900000,
    status: "OPEN"
  },
  {
    question: "Will Salesforce acquire another enterprise SaaS firm for over $10B?",
    category: "Stocks",
    description: "Resolves to 'YES' if Salesforce announces a merger agreement with value >= $10B.",
    yesPrice: 18,
    noPrice: 82,
    volumeUsd: 2500000,
    status: "OPEN"
  },
  {
    question: "Will Shopify's quarterly revenue growth exceed 35% year-over-year?",
    category: "Stocks",
    description: "Resolves to 'YES' if Shopify reports quarterly YoY revenue growth over 35%.",
    yesPrice: 48,
    noPrice: 52,
    volumeUsd: 2900000,
    status: "OPEN"
  },
  {
    question: "Will Coinbase launch its own independent Layer 1 blockchain network?",
    category: "Stocks",
    description: "Resolves to 'YES' if Coinbase announces a new Layer 1 network separate from Base L2.",
    yesPrice: 12,
    noPrice: 88,
    volumeUsd: 1700000,
    status: "OPEN"
  },
  {
    question: "Will ARM Holdings P/E ratio exceed 200 on trailing twelve months earnings?",
    category: "Stocks",
    description: "Resolves to 'YES' if ARM TTM P/E ratio crosses 200 during trading hours.",
    yesPrice: 58,
    noPrice: 42,
    volumeUsd: 3600000,
    status: "OPEN"
  },
  {
    question: "Will Intel split its chip design and manufacturing foundry into two independent companies?",
    category: "Stocks",
    description: "Resolves to 'YES' if Intel formally announces a plan to spin off or split its foundry business.",
    yesPrice: 68,
    noPrice: 32,
    volumeUsd: 7300000,
    status: "OPEN"
  },
  {
    question: "Will Airbnb announce a flight booking or package travel service on its main platform?",
    category: "Stocks",
    description: "Resolves to 'YES' if Airbnb releases a flight search/booking tool globally.",
    yesPrice: 22,
    noPrice: 78,
    volumeUsd: 1400000,
    status: "OPEN"
  },
  {
    question: "Will Uber achieve an annual net profit margin exceeding 8%?",
    category: "Stocks",
    description: "Resolves to 'YES' if Uber's annual audited report shows net profit margin > 8%.",
    yesPrice: 62,
    noPrice: 38,
    volumeUsd: 4900000,
    status: "OPEN"
  },
  {
    question: "Will Zoom acquire an enterprise smart video hardware maker?",
    category: "Stocks",
    description: "Resolves to 'YES' if Zoom announces a definitive agreement to buy a smart screen/video hardware company.",
    yesPrice: 40,
    noPrice: 60,
    volumeUsd: 800000,
    status: "OPEN"
  }
];
