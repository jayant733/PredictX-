// --- MOCK DATA SEED ---
export const MOCK_MARKET = {
    id: "mkt-123",
    category: "Politics",
    title: "Will the US enter a recession in 2024?",
    endDate: "Dec 31, 2024",
    volume: "$4.2M",
    currentProbability: 34,
    probabilityChange: 2.4, // positive is up
    about: "This market resolves to 'Yes' if the National Bureau of Economic Research (NBER) declares that the United States economy entered a recession at any point during the 2024 calendar year. NBER's Business Cycle Dating Committee is the official arbiter of recessions in the US, typically defined as a significant decline in economic activity.",
    rules: [
        "Source: Official NBER data releases.",
        "Resolution Date: Jan 31, 2025 (or earlier if NBER confirms).",
        "Outcome: Binary (Yes/No).",
        "Oracle: Chainlink verified feed from BEA/NBER reports."
    ],
    orderbook: {
        asks: [
            { price: 0.36, size: "4.2K", percentage: 70 },
            { price: 0.35, size: "1.8K", percentage: 45 },
            { price: 0.34, size: "950", percentage: 20 },
        ],
        bids: [
            { price: 0.33, size: "2.1K", percentage: 30 },
            { price: 0.32, size: "5.6K", percentage: 55 },
            { price: 0.31, size: "12.4K", percentage: 85 },
        ],
        spread: "0.01 (2.9%)",
        lastPrice: "0.34¢"
    },
    userBalance: 12450.00
};

// Generate dynamic chart SVG coordinates based on historical pricing entries
export const getChartPath = (chartData: any[]) => {
    if (!chartData || chartData.length === 0) {
        return {
            linePath: "M0,150 L200,140 L400,160 L600,130 L800,150 L1000,120",
            fillPath: "M0,150 L200,140 L400,160 L600,130 L800,150 L1000,120 L1000,200 L0,200 Z"
        };
    }

    const points = chartData.map((entry: any, idx: number) => {
        const x = (idx / (chartData.length - 1)) * 1000;
        // Map yesPrice (1-99) to Y coordinate (0-200)
        const y = 200 - (entry.yesPrice * 2);
        return { x, y };
    });

    const linePath = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
    const fillPath = `${linePath} L1000,200 L0,200 Z`;

    return { linePath, fillPath };
};
