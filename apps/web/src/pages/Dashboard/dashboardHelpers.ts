export const MOCK_MARKETS = [
    {
        id: "btc-100k",
        category: "CRYPTO",
        categoryColor: "secondary-container",
        endDate: "Dec 31, 2024",
        title: "Will Bitcoin reach $100k by December?",
        volume: "$156,000",
        chance: "75%",
        yesPrice: "75¢",
        noPrice: "25¢",
        svgStroke: "rgba(0, 242, 255, 0.4)",
        grad: "grad1",
        borderClass: "border-l-primary/30"
    },
    {
        id: "ucl-2024",
        category: "SPORTS",
        categoryColor: "secondary-container",
        endDate: "June 1, 2024",
        title: "Will Real Madrid win the UEFA Champions League 2024?",
        volume: "$8,500",
        chance: "60%",
        yesPrice: "60¢",
        noPrice: "40¢",
        svgStroke: "rgba(0, 242, 255, 0.4)",
        grad: "grad2",
        borderClass: ""
    },
    {
        id: "recession-2024",
        category: "POLITICS",
        categoryColor: "tertiary-container",
        endDate: "Dec 31, 2024",
        title: "Will the US enter a recession in 2024?",
        volume: "$42,000",
        chance: "34%",
        yesPrice: "34¢",
        noPrice: "66¢",
        svgStroke: "rgba(255, 180, 171, 0.4)",
        grad: "",
        borderClass: "border-l-secondary/30"
    }
];

export const mapDbMarkets = (dbMarkets: any[]) => {
    if (!dbMarkets || dbMarkets.length === 0) return MOCK_MARKETS;
    return dbMarkets.map(m => {
        const question = m.title || m.question || "Unknown Market";
        const rawEndDate = m.endDate || m.endTime;
        const rawVolume = m.volume !== undefined ? m.volume : m.volumeUsd;
        
        let formattedDate = "Invalid Date";
        if (rawEndDate) {
            const parsedDate = new Date(rawEndDate);
            if (!isNaN(parsedDate.getTime())) {
                formattedDate = parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }

        const category = m.category || "General";

        return {
            id: m.id,
            category: category.toUpperCase(),
            categoryColor: category.toLowerCase() === 'politics' ? 'tertiary-container' : 'secondary-container',
            endDate: formattedDate,
            title: question,
            volume: `$${((rawVolume || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            chance: `${m.yesPrice}%`,
            yesPrice: `${m.yesPrice}¢`,
            noPrice: `${m.noPrice}¢`,
            svgStroke: "rgba(0, 242, 255, 0.4)",
            grad: "grad1",
            borderClass: category.toLowerCase() === 'politics' ? "" : "border-l-primary/30"
        };
    });
};
