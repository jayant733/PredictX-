import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/Header/Header';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { TrendingCarousel } from './TrendingCarousel';
import { MarketCard } from './MarketCard';
import { AdminConsoleModal } from './AdminConsoleModal';
import { mapDbMarkets } from './dashboardHelpers';

const Dashboard: React.FC = () => {
    const { isDark } = useTheme();
    const { isLoggedIn, session, claims } = useAuth();
    const navigate = useNavigate();
    const walletAddress = (claims?.wallet as string) || '';
    const isAdmin = walletAddress === "DemoUserWalletAddress11111111111111111111";

    // Query & Filters State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("volume");
    const [page] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [dbMarkets, setDbMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // AI modal settings
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [promptInput, setPromptInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Price flash alerts mapping
    const [priceAlerts, setPriceAlerts] = useState<Record<string, 'up' | 'down'>>({});

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const fetchMarkets = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "100",
                search: searchQuery,
                category: selectedCategory,
                sort: sortOption
            });
            const response = await fetch(`${API_URL}/api/markets?${params}`);
            if (response.ok) {
                const data = await response.json();
                setDbMarkets(data);
            } else {
                setErrorMsg("Failed to load active markets from database.");
            }
        } catch (err) {
            console.error("Failed to fetch markets from backend:", err);
            setErrorMsg("Connection error: Unable to contact prediction-engine.");
        } finally {
            setLoading(false);
        }
    };

    // WebSocket real-time updates connection
    useEffect(() => {
        const wsUrl = API_URL.replace(/^http/, "ws") + "/api/ws";
        let ws: WebSocket;

        const connectWs = () => {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "PRICE_UPDATE") {
                        setDbMarkets(prev => prev.map(m => {
                            if (m.id === data.marketId) {
                                const direction = data.yesPrice > m.yesPrice ? 'up' : 'down';
                                setPriceAlerts(alerts => ({ ...alerts, [m.id]: direction }));
                                
                                setTimeout(() => {
                                    setPriceAlerts(alerts => {
                                        const copy = { ...alerts };
                                        delete copy[m.id];
                                        return copy;
                                    });
                                }, 1000);

                                return {
                                    ...m,
                                    yesPrice: data.yesPrice,
                                    noPrice: data.noPrice,
                                    probability: data.yesPrice / 100,
                                    volume: data.volumeUsd
                                };
                            }
                            return m;
                        }));
                    }
                } catch (e) {
                    console.error("WS error on message:", e);
                }
            };
            ws.onclose = () => {
                setTimeout(connectWs, 5000);
            };
        };

        connectWs();
        return () => {
            if (ws) ws.close();
        };
    }, []);

    useEffect(() => {
        fetchMarkets();
    }, [searchQuery, selectedCategory, sortOption, page]);

    const recessionMarket = dbMarkets.find(m => m.title.toLowerCase().includes("recession"));
    const btcMarket = dbMarkets.find(m => m.title.toLowerCase().includes("bitcoin") || m.title.toLowerCase().includes("btc"));
    const uclMarket = dbMarkets.find(m => m.title.toLowerCase().includes("champions") || m.title.toLowerCase().includes("ucl") || m.title.toLowerCase().includes("madrid"));

    // Maps database models to frontend UI shapes
    const displayMarkets = mapDbMarkets(dbMarkets);

    const handleGenerateMarket = async () => {
        if (!promptInput.trim()) return;
        setIsGenerating(true);
        setErrorMsg(null);
        try {
            const response = await fetch(`${API_URL}/api/ai/market/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ prompt: promptInput })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to generate market');
            setPromptInput("");
            setShowAdminModal(false);
            fetchMarkets();
        } catch (err: any) {
            setErrorMsg(err.message || 'Error generating market');
        } finally {
            setIsGenerating(false);
        }
    };

    const [isSyncing, setIsSyncing] = useState(false);
    const handleSyncPolymarket = async () => {
        setIsSyncing(true);
        setErrorMsg(null);
        try {
            const response = await fetch(`${API_URL}/api/markets/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to sync with Polymarket');
            alert(`Successfully synced and seeded ${data.synced} new prediction markets!`);
            setShowAdminModal(false);
            fetchMarkets();
        } catch (err: any) {
            setErrorMsg(err.message || 'Error syncing Polymarket');
        } finally {
            setIsSyncing(false);
        }
    };

    const getPriceStyle = (marketId: string) => {
        const alert = priceAlerts[marketId];
        if (alert === 'up') return { color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)', transition: 'all 0.3s ease' };
        if (alert === 'down') return { color: '#ef4444', textShadow: '0 0 10px rgba(239, 68, 68, 0.5)', transition: 'all 0.3s ease' };
        return { transition: 'all 0.3s ease' };
    };

    return (
        <div className={`bg-background text-on-background font-body-md selection:bg-primary/30 min-h-screen ${isDark ? 'dark' : ''}`}>
            <Header />
            <Sidebar />
            
            <main className="ml-64 pt-24 px-margin-desktop pb-12">
                {/* Search, Sort, and View Toggle Header */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <div className="flex gap-4 flex-1">
                        <div className="flex relative group w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">search</span>
                            <input className="bg-surface-container-low border border-outline-variant/30 rounded-lg pl-10 pr-4 py-1.5 w-full focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body-md text-sm text-on-surface" placeholder="Search markets..." type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        
                        <div className="flex items-center bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 text-xs">
                            <span className="text-outline mr-2">SORT:</span>
                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-on-surface focus:outline-none cursor-pointer py-1 font-bold">
                                <option value="volume">Volume</option>
                                <option value="liquidity">Liquidity</option>
                                <option value="newest">Newest</option>
                                <option value="ending_soon">Ending Soon</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-surface-container-low border border-outline-variant/30 rounded-lg p-1">
                            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                                <span className="material-symbols-outlined text-xs">grid_view</span>Grid
                            </button>
                            <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'table' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                                <span className="material-symbols-outlined text-xs">table_rows</span>Table
                            </button>
                        </div>

                        {isLoggedIn && (
                            <button onClick={() => setShowAdminModal(true)} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.1)] active:scale-95 cursor-pointer">
                                <span className="material-symbols-outlined text-sm">precision_manufacturing</span>AI Admin Console
                            </button>
                        )}
                    </div>
                </div>

                <TrendingCarousel btcMarketFromDb={btcMarket} uclMarketFromDb={uclMarket} recessionMarketFromDb={recessionMarket} onNavigateMarket={navigate} />
                
                <section className="mt-8">
                    {/* Category Selector Tabs */}
                    <div className="flex items-center gap-4 mb-8 overflow-x-auto hide-scrollbar pb-2">
                        {["ALL", "POLITICS", "CRYPTO", "SPORTS", "SCIENCE", "BUSINESS"].map(cat => (
                            <button 
                                key={cat}
                                className={`px-6 py-2 rounded-full border transition-all font-label-caps whitespace-nowrap cursor-pointer ${
                                    (cat === "ALL" && !selectedCategory) || selectedCategory.toUpperCase() === cat 
                                        ? 'border-2 border-primary text-primary bg-primary/5 glow-cyan' 
                                        : 'border border-outline-variant/30 text-outline hover:border-outline hover:text-on-surface'
                                }`}
                                onClick={() => setSelectedCategory(cat === "ALL" ? "" : cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    
                    {/* Loading, Empty, and Error States */}
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-outline animate-pulse font-medium">Syncing live predictions...</span>
                        </div>
                    ) : errorMsg ? (
                        <div className="glass-panel border border-error/20 p-8 rounded-xl text-center max-w-md mx-auto space-y-4">
                            <span className="material-symbols-outlined text-error text-4xl">error</span>
                            <h3 className="text-lg font-bold text-on-surface">Failed to load prediction markets</h3>
                            <p className="text-xs text-outline leading-relaxed">{errorMsg}</p>
                            <button onClick={fetchMarkets} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-2 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all">RETRY CONNECTION</button>
                        </div>
                    ) : dbMarkets.length === 0 ? (
                        <div className="py-16 text-center text-on-surface-variant font-body-md">
                            No active markets found matching "{searchQuery}"
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayMarkets.map((market: any) => (
                                <MarketCard key={market.id} market={market} onNavigate={() => navigate(`/market/${market.id}`)} />
                            ))}
                        </div>
                    ) : (
                        // Live Polymarket Columns Table Layout
                        <div className="glass-panel rounded-xl border border-outline-variant/20 overflow-hidden text-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[10px] text-outline uppercase tracking-wider font-label-caps">
                                            <th className="py-4 px-6 font-bold">Market</th>
                                            <th className="py-4 px-3 font-bold">Category</th>
                                            <th className="py-4 px-3 font-bold text-center">Probability</th>
                                            <th className="py-4 px-3 font-bold text-center">YES Price</th>
                                            <th className="py-4 px-3 font-bold text-center">NO Price</th>
                                            <th className="py-4 px-3 font-bold text-right">Volume</th>
                                            <th className="py-4 px-3 font-bold text-right">Liquidity</th>
                                            <th className="py-4 px-3 font-bold">End Date</th>
                                            <th className="py-4 px-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                                        {dbMarkets.map((m: any) => {
                                            const probabilityPercent = `${Math.round(m.probability * 100)}%`;
                                            const yesPriceText = `${m.yesPrice}¢`;
                                            const noPriceText = `${m.noPrice}¢`;
                                            const formattedVolume = `$${(m.volume / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                            const formattedLiquidity = `$${(m.liquidity / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                            const formattedEndDate = new Date(m.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                                            return (
                                                <tr key={m.id} onClick={() => navigate(`/market/${m.id}`)} className="hover:bg-surface-container-high/40 transition-colors cursor-pointer group">
                                                    <td className="py-4 px-6 font-semibold group-hover:text-primary transition-colors max-w-sm truncate">{m.title}</td>
                                                    <td className="py-4 px-3"><span className="text-[10px] uppercase font-bold text-outline-variant bg-surface-container px-2 py-0.5 rounded">{m.category}</span></td>
                                                    <td className="py-4 px-3 text-center font-data-mono font-bold text-primary">{probabilityPercent}</td>
                                                    <td className="py-4 px-3 text-center font-data-mono text-secondary font-bold" style={getPriceStyle(m.id)}>{yesPriceText}</td>
                                                    <td className="py-4 px-3 text-center font-data-mono text-error font-bold" style={getPriceStyle(m.id)}>{noPriceText}</td>
                                                    <td className="py-4 px-3 text-right font-data-mono">{formattedVolume}</td>
                                                    <td className="py-4 px-3 text-right font-data-mono text-outline-variant">{formattedLiquidity}</td>
                                                    <td className="py-4 px-3 text-outline-variant text-xs">{formattedEndDate}</td>
                                                    <td className="py-4 px-6"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse"></span>Active</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
            
            {isLoggedIn && isAdmin && (
                <button onClick={() => setShowAdminModal(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 cursor-pointer">
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            )}

            <AdminConsoleModal 
                showAdminModal={showAdminModal} 
                setShowAdminModal={setShowAdminModal} 
                promptInput={promptInput} 
                setPromptInput={setPromptInput} 
                isGenerating={isGenerating} 
                errorMsg={errorMsg} 
                onGenerateMarket={handleGenerateMarket}
                isSyncing={isSyncing}
                onSyncPolymarket={handleSyncPolymarket}
            />
        </div>
    );
};

export default Dashboard;
