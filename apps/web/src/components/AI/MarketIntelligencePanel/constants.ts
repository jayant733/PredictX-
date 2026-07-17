export interface IntelligenceReport {
    bullet1: string;
    bullet2: string;
    bullet3: string;
    fullReport: string;
}

export interface IntelligenceState {
    query: string;
    marketId: string;
    steps: string[];
    newsData?: string;
    twitterData?: string;
    cryptoData?: string;
    marketData?: string;
    summary?: IntelligenceReport;
}

export const agentMeta = [
    { key: 'news', label: 'News Feed', icon: 'news', color: 'border-cyan-500/30 text-cyan-400' },
    { key: 'twitter', label: 'Social Sentiment', icon: 'alternate_email', color: 'border-sky-500/30 text-sky-400' },
    { key: 'crypto', label: 'On-Chain flows', icon: 'currency_bitcoin', color: 'border-yellow-500/30 text-yellow-400' },
    { key: 'market', label: 'CLOB Depth', icon: 'monitoring', color: 'border-[#ff0055]/30 text-[#ff0055]' },
    { key: 'synthesis', label: 'Synthesis Compiler', icon: 'psychology', color: 'border-emerald-500/30 text-emerald-400' }
];

export const tabsMeta = [
    { key: 'synthesis', label: 'Synthesis Report', icon: 'psychology' },
    { key: 'news', label: 'News data', icon: 'news' },
    { key: 'twitter', label: 'Twitter Logs', icon: 'alternate_email' },
    { key: 'crypto', label: 'On-Chain Inflows', icon: 'currency_bitcoin' },
    { key: 'market', label: 'CLOB Analytics', icon: 'monitoring' }
];
