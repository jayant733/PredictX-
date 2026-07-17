import React, { useState, useEffect } from 'react';

interface AIInsightsCardProps {
    marketId: string;
}

interface InsightsData {
    sentimentScore: number;
    summary: string;
    recommendation: string;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ marketId }) => {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                setLoading(true);
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${API_URL}/api/ai/insights?marketId=${marketId}`);
                if (!response.ok) throw new Error("Failed to fetch insights");
                const resData = await response.json();
                setData(resData);
            } catch (err) {
                console.error("AI Insights fetch failed:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (marketId) {
            fetchInsights();
        }
    }, [marketId]);

    if (loading) {
        return (
            <div className="glass-panel rounded-xl p-6 border border-outline-variant/10 animate-pulse space-y-4">
                <div className="h-4 bg-surface-container rounded w-1/3"></div>
                <div className="h-2 bg-surface-container rounded w-full"></div>
                <div className="h-8 bg-surface-container rounded-lg w-full"></div>
            </div>
        );
    }

    if (error || !data) {
        return null; // Fail silently if AI endpoints are not reachable or disable AI features
    }

    const isBuyYes = data.recommendation === 'BUY YES';
    const isBuyNo = data.recommendation === 'BUY NO';

    const recClass = isBuyYes 
        ? 'text-[#00f2ff] border-[#00f2ff]/20 bg-[#00f2ff]/5 shadow-[0_0_10px_rgba(0,242,255,0.05)]' 
        : isBuyNo 
        ? 'text-[#ff0055] border-[#ff0055]/20 bg-[#ff0055]/5 shadow-[0_0_10px_rgba(255,0,85,0.05)]' 
        : 'text-amber-400 border-amber-400/20 bg-amber-400/5';

    return (
        <div className="glass-panel rounded-xl p-6 border border-outline-variant/20 market-detail-metallic-border bg-surface-container-low/40 backdrop-blur-md relative overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            {/* Neon Accent Glow */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500"></div>
            
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                        <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">AI Insights & Sentiment</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${recClass} flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-xs">analytics</span>
                        {data.recommendation}
                    </div>
                </div>

                {/* Sentiment Meter */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant font-data-mono uppercase">
                        <span className="text-[#ff0055]">NO SENTIMENT ({100 - data.sentimentScore}%)</span>
                        <span className="text-[#00f2ff]">YES SENTIMENT ({data.sentimentScore}%)</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden flex border border-outline-variant/10">
                        <div 
                            className="bg-[#ff0055] transition-all duration-1000 shadow-[0_0_8px_rgba(255,0,85,0.6)]" 
                            style={{ width: `${100 - data.sentimentScore}%` }}
                        ></div>
                        <div 
                            className="bg-[#00f2ff] transition-all duration-1000 shadow-[0_0_8px_rgba(0,242,255,0.6)]" 
                            style={{ width: `${data.sentimentScore}%` }}
                        ></div>
                    </div>
                </div>

                {/* Summary content */}
                <div className="text-body-md text-on-surface-variant leading-relaxed">
                    {data.summary}
                </div>

                {/* Footer disclaimer */}
                <div className="pt-3 border-t border-outline-variant/10 flex items-center gap-1 text-[9px] text-on-surface-variant/40 font-data-mono">
                    <span className="material-symbols-outlined text-xs opacity-60">warning</span>
                    <span>AI-generated prediction rationale. Not Financial Advice (NFA).</span>
                </div>
            </div>
        </div>
    );
};
