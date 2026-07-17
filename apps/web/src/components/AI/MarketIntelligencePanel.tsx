import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RichReportRenderer } from './MarketIntelligencePanel/RichReportRenderer';
import { SourceMaterials } from './MarketIntelligencePanel/SourceMaterials';
import { AgentGraph } from './MarketIntelligencePanel/AgentGraph';
import { Consensus } from './MarketIntelligencePanel/Consensus';
import { agentMeta, tabsMeta } from './MarketIntelligencePanel/constants';
import type { IntelligenceState } from './MarketIntelligencePanel/constants';

interface MarketIntelligencePanelProps {
    marketId: string;
}

export const MarketIntelligencePanel: React.FC<MarketIntelligencePanelProps> = ({ marketId }) => {
    const { isLoggedIn, session } = useAuth();
    const [query, setQuery] = useState("Why did BTC YES price jump from 62 to 71 today?");
    const [loading, setLoading] = useState(false);
    const [activeNode, setActiveNode] = useState<number>(-1);
    const [fullState, setFullState] = useState<IntelligenceState | null>(null);
    const [selectedTab, setSelectedTab] = useState<'synthesis' | 'news' | 'twitter' | 'crypto' | 'market'>('synthesis');
    const [error, setError] = useState(false);

    const runAgentGraph = async () => {
        if (!query.trim() || loading) return;
        setLoading(true);
        setError(false);
        setFullState(null);
        setSelectedTab('synthesis');

        for (let i = 0; i < 5; i++) {
            setActiveNode(i);
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/ai/intelligence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ marketId, query })
            });

            if (!response.ok) throw new Error("Graph execution failed");
            setFullState(await response.json() as IntelligenceState);
        } catch (err) {
            console.error("Multi-Agent execution failed:", err);
            setError(true);
        } finally {
            setLoading(false);
            setActiveNode(-1);
        }
    };

    return (
        <div className="glass-panel rounded-2xl p-6 border border-outline-variant/20 market-detail-metallic-border bg-[#07080a]/90 backdrop-blur-2xl relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-fade-in">
            <div className="absolute top-0 left-0 w-20 h-[1px] bg-gradient-to-r from-[#00f2ff] to-transparent"></div>
            <div className="absolute top-0 left-0 w-[1px] h-20 bg-gradient-to-b from-[#00f2ff] to-transparent"></div>

            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-outline-variant/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/25">
                            <span className="material-symbols-outlined text-primary text-2xl animate-pulse">hub</span>
                        </div>
                        <div>
                            <h3 className="font-headline-sm text-sm font-extrabold text-on-surface uppercase tracking-wider">Multi-Agent Market Intelligence</h3>
                            <p className="text-[10px] text-on-surface-variant font-data-mono uppercase tracking-widest mt-0.5">LangGraph State Nodes • RAG Research pipeline</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold font-data-mono uppercase tracking-wider">Active Graph Deployed</span>
                    </div>
                </div>

                {isLoggedIn ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Agent Target Query</label>
                            <span className="text-[10px] text-on-surface-variant/40 font-data-mono">Tavily Search + Pinecone Indexing</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 bg-surface-container/30 p-1.5 rounded-xl border border-outline-variant/15 focus-within:border-primary-container/40 transition-colors">
                            <input type="text" className="flex-1 bg-transparent px-4 py-2.5 text-xs text-on-surface focus:outline-none placeholder-on-surface-variant/30" value={query} onChange={(e) => setQuery(e.target.value)} disabled={loading} placeholder="Why did BTC YES price jump today?" />
                            <button onClick={runAgentGraph} disabled={loading || !query.trim()} className="bg-primary-container text-on-primary-container px-6 py-3 text-xs font-bold rounded-lg border border-[#00f2ff]/35 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer">
                                <span className="material-symbols-outlined text-sm">rocket_launch</span> RUN STATE GRAPH
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-surface-container-low/20 rounded-xl border border-outline-variant/10 text-xs font-bold text-on-surface-variant/60 font-data-mono uppercase tracking-wider">🔒 Connect Solana Wallet to run LangGraph research pipeline</div>
                )}

                {(loading || fullState) && <AgentGraph agentMeta={agentMeta} fullState={fullState} activeNode={activeNode} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />}

                {fullState?.summary && (
                    <div className="space-y-6 animate-fade-in">
                        <Consensus summary={fullState.summary} />
                        <div className="bg-surface-container-low/30 border border-outline-variant/15 rounded-xl overflow-hidden flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
                            <div className="flex border-b border-outline-variant/10 bg-[#0A0B0D]/50 scrollbar-none overflow-x-auto">
                                {tabsMeta.map((tab) => (
                                    <button key={tab.key} onClick={() => setSelectedTab(tab.key as any)} className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${selectedTab === tab.key ? 'border-primary text-primary bg-primary-container/10 font-extrabold' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>{tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-6 min-h-[160px] bg-surface-container-low/10">
                                {selectedTab === 'synthesis' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-on-surface border-b border-outline-variant/10 pb-2">
                                            <span className="material-symbols-outlined text-[#00f2ff] text-sm">dashboard_customize</span><span>Multi-Agent Compiler Report Output</span>
                                        </div>
                                        <RichReportRenderer report={fullState.summary.fullReport} />
                                    </div>
                                ) : (
                                    <SourceMaterials selectedTab={selectedTab as any} newsData={fullState.newsData} twitterData={fullState.twitterData} cryptoData={fullState.cryptoData} marketData={fullState.marketData} />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-xs text-error font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span><span>Failed to run state graph nodes. Please ensure DATABASE_URL and LLM APIs are active.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
