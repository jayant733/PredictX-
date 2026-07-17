import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolioState } from '../../hooks/usePortfolioState';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { Sidebar } from '../../components/Sidebar/Sidebar';

interface Position {
  marketId: string;
  question?: string;
  outcome: 'YES' | 'NO';
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  currentProfitCents?: number;
  roiPct?: number;
}

interface Bot {
  id: string;
  name: string;
  strategy: string;
  avatar: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  balanceUsd: number;
  positions: Position[];
  userSetting?: {
    enabled: boolean;
    allocatedBalanceCents: number;
    reservedBalanceCents: number;
    realizedPnlCents: number;
    unrealizedPnlCents: number;
    totalTrades: number;
    winningTrades: number;
    maxDrawdownPercent: number;
    dailyLossCents: number;
    sharpeRatio: number;
    exposureCents: number;
  }
}

interface LogEntry {
  timestamp: string;
  bot: string;
  message: string;
}

interface LedgerEntry {
  id: string;
  transactionType: string;
  debitCents: number;
  creditCents: number;
  description: string;
  createdAt: string;
}

interface Analytics {
  freeWalletCents: number;
  totalAllocatedCents: number;
  totalReservedCents: number;
  marketValueCents: number;
  totalEquityCents: number;
  todayPnLCents: number;
  dailyLossCents: number;
}

const AiTrading: React.FC = () => {
    const { isLoggedIn, loading, session } = useAuth();
    const portfolioState = usePortfolioState();
    const navigate = useNavigate();
    const [bots, setBots] = useState<Bot[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [analytics, setAnalytics] = useState<Analytics>({
        freeWalletCents: 0,
        totalAllocatedCents: 0,
        totalReservedCents: 0,
        marketValueCents: 0,
        totalEquityCents: 0,
        todayPnLCents: 0,
        dailyLossCents: 0
    });
    const [runningCycle, setRunningCycle] = useState(false);
    const [editingAllocations, setEditingAllocations] = useState<Record<string, number>>({});
    const [stoppingAll, setStoppingAll] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const handleStopAllTrading = async () => {
        if (!session?.access_token) return;
        if (!confirm("Are you sure you want to stop all AI trading and refund your allocations back to your main wallet balance?")) return;
        setStoppingAll(true);
        try {
            const response = await fetch(`${API_URL}/api/ai/traders/stop-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (response.ok) {
                await fetchAllData();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to stop AI trading");
            }
        } catch (err) {
            console.error("Error stopping AI trading:", err);
        } finally {
            setStoppingAll(false);
        }
    };

    const fetchAllData = async () => {
        if (!session?.access_token) return;
        try {
            const headers = { 'Authorization': `Bearer ${session.access_token}` };
            
            // 1. Fetch bots
            const resBots = await fetch(`${API_URL}/api/ai/traders`, { headers });
            if (resBots.ok) {
                const data = await resBots.json();
                setBots(data.bots || []);
                const sortedLogs = (data.logs || []).map((l: any) => ({
                    timestamp: l.timestamp || new Date().toISOString(),
                    bot: l.bot,
                    message: l.message
                })).reverse();
                setLogs(sortedLogs);
            }

            // 2. Fetch ledger
            const resLedger = await fetch(`${API_URL}/api/ai/traders/ledger`, { headers });
            if (resLedger.ok) {
                const data = await resLedger.json();
                setLedger(data.ledger || []);
            }

            // 3. Fetch analytics
            const resAnalytics = await fetch(`${API_URL}/api/ai/traders/analytics`, { headers });
            if (resAnalytics.ok) {
                const data = await resAnalytics.json();
                setAnalytics(data.analytics || {
                    freeWalletCents: 0,
                    totalAllocatedCents: 0,
                    totalReservedCents: 0,
                    marketValueCents: 0,
                    totalEquityCents: 0,
                    todayPnLCents: 0,
                    dailyLossCents: 0
                });
            }
            window.dispatchEvent(new Event('balance-change'));
        } catch (err) {
            console.error("Failed to fetch traders dashboard data:", err);
        }
    };

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            navigate('/login');
            return;
        }
        if (isLoggedIn) {
            fetchAllData();
            const interval = setInterval(fetchAllData, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, loading, session]);

    const [runningCycles, setRunningCycles] = useState<Record<string, boolean>>({});

    const handleTriggerCycle = async (botId?: string) => {
        if (!session?.access_token) return;
        
        if (botId) {
            setRunningCycles(prev => ({ ...prev, [botId]: true }));
        } else {
            setRunningCycle(true);
        }

        try {
            const response = await fetch(`${API_URL}/api/ai/traders/cycle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ botId })
            });
            if (response.ok) {
                await fetchAllData();
            }
        } catch (err) {
            console.error("Error triggering trader cycle:", err);
        } finally {
            if (botId) {
                setRunningCycles(prev => ({ ...prev, [botId]: false }));
            } else {
                setRunningCycle(false);
            }
        }
    };

    const handleToggleDelegation = async (botId: string, enabled: boolean, currentCents: number) => {
        if (!session?.access_token) return;
        try {
            const res = await fetch(`${API_URL}/api/ai/traders/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    botId,
                    enabled,
                    allocatedBalanceCents: currentCents
                })
            });
            if (res.ok) {
                await fetchAllData();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update delegation setting");
            }
        } catch (err) {
            console.error("Error toggling delegation:", err);
        }
    };

    const handleSaveAllocation = async (botId: string) => {
        if (!session?.access_token) return;
        const val = editingAllocations[botId];
        if (val === undefined) return;
        const cents = Math.round(val * 100);
        
        try {
            const bot = bots.find(b => b.id === botId);
            const res = await fetch(`${API_URL}/api/ai/traders/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    botId,
                    enabled: bot?.userSetting?.enabled || false,
                    allocatedBalanceCents: cents
                })
            });
            if (res.ok) {
                await fetchAllData();
                const newEdits = { ...editingAllocations };
                delete newEdits[botId];
                setEditingAllocations(newEdits);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update allocation balance");
            }
        } catch (err) {
            console.error("Error saving allocation:", err);
        }
    };

    // Derived multi-strategy stats
    const totalEquity = portfolioState.totalEquity;
    const todayPnL = (analytics.todayPnLCents || 0) / 100;
    const dailyReturnPct = totalEquity > 0 ? (todayPnL / totalEquity) * 100 : 0;
    const totalRealizedPnL = bots.reduce((sum, b) => sum + (b.userSetting?.realizedPnlCents || 0), 0) / 100;
    const totalUnrealizedPnL = bots.reduce((sum, b) => sum + (b.userSetting?.unrealizedPnlCents || 0), 0) / 100;

    // Build risk index metrics
    const totalAllocatedSum = bots.reduce((sum, b) => sum + (b.userSetting?.allocatedBalanceCents || 0), 0);
    const avgRiskScore = bots.reduce((sum, b) => {
        const weight = (b.userSetting?.allocatedBalanceCents || 0) / (totalAllocatedSum || 1);
        const score = b.risk === 'HIGH' ? 85 : b.risk === 'MEDIUM' ? 50 : 20;
        return sum + (score * weight);
    }, 0);

    return (
        <div className="bg-[#0A0B0D] text-[#e3e2e5] font-body-md text-body-md min-h-screen selection:bg-primary-container selection:text-on-primary">
            <Header />
            <Sidebar />

            <main className="ml-64 pt-24 px-8 pb-12 max-w-container-max mx-auto space-y-8 animate-fade-in">
                {/* Institutional Title & Cycles Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">query_stats</span>
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Institutional Fund Portfolio Console
                            </h1>
                        </div>
                        <p className="text-on-surface-variant text-xs max-w-2xl leading-relaxed">
                            Oversee your multi-strategy prediction sleeves. Each AI bot operates as an independent fund manager with strict double-entry ledger bookkeeping and automatic risk limit checks.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleTriggerCycle()}
                            disabled={runningCycle}
                            className="bg-primary hover:brightness-110 active:scale-95 text-on-primary font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {runningCycle ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                    TICKING AGENTS...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">bolt</span>
                                    TRIGGER PORTFOLIO CYCLE
                                </>
                            )}
                        </button>

                        <button 
                            onClick={handleStopAllTrading}
                            disabled={stoppingAll}
                            className="bg-error/10 hover:bg-error/20 text-error border border-error/30 hover:border-error/50 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,59,48,0.15)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {stoppingAll ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-error border-t-transparent rounded-full animate-spin"></div>
                                    LIQUIDATING FUND...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">dangerous</span>
                                    STOP ALL TRADING & REFUND
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Institutional Accounting Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass-panel p-5 rounded-xl border border-outline-variant/15 space-y-2 shadow-sm">
                        <span className="text-[10px] text-outline font-label-caps block">Total Account Equity</span>
                        <span className="text-3xl font-extrabold text-on-surface font-data-mono">${totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        <div className="text-xs flex gap-2">
                            <span className="text-outline">Buying Power:</span>
                            <span className="font-bold text-secondary font-data-mono">${portfolioState.buyingPower.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl border border-outline-variant/15 space-y-2 shadow-sm">
                        <span className="text-[10px] text-outline font-label-caps block">Daily Return</span>
                        <span className={`text-3xl font-extrabold font-data-mono ${todayPnL >= 0 ? 'text-emerald-400' : 'text-error'}`}>
                            {todayPnL >= 0 ? '+' : ''}${todayPnL.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                        <div className="text-xs flex gap-1 items-center">
                            <span className={`font-semibold ${todayPnL >= 0 ? 'text-emerald-400' : 'text-error'}`}>{todayPnL >= 0 ? '+' : ''}{dailyReturnPct.toFixed(2)}%</span>
                            <span className="text-outline">from yesterday</span>
                        </div>
                        <div className="text-xs flex gap-2 pt-2 border-t border-outline-variant/10 mt-2 text-[10px] text-outline">
                            <span>Realized: <strong className={totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-error'}>${totalRealizedPnL >= 0 ? '+' : ''}{totalRealizedPnL.toFixed(2)}</strong></span>
                            <span>|</span>
                            <span>Unrealized: <strong className={totalUnrealizedPnL >= 0 ? 'text-cyan-400' : 'text-error'}>${totalUnrealizedPnL >= 0 ? '+' : ''}{totalUnrealizedPnL.toFixed(2)}</strong></span>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl border border-outline-variant/15 space-y-2 shadow-sm">
                        <span className="text-[10px] text-outline font-label-caps block">Delegated Cash</span>
                        <span className="text-3xl font-extrabold text-cyan-400 font-data-mono">${portfolioState.delegatedCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        <div className="text-xs flex gap-2">
                            <span className="text-outline">Available Cash (Undelegated):</span>
                            <span className="font-bold text-on-surface font-data-mono">${portfolioState.availableCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-xl border border-outline-variant/15 space-y-2 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] text-outline font-label-caps block">Aggregated Fund Risk Meter</span>
                            <div className="h-2 w-full bg-surface-container rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-success via-warning to-error transition-all" style={{ width: `${Math.max(10, Math.min(100, avgRiskScore))}%` }}></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-outline mt-1 font-semibold uppercase">
                            <span>Conservative</span>
                            <span>Weighted Score: {avgRiskScore.toFixed(0)}</span>
                            <span>Aggressive</span>
                        </div>
                    </div>
                </div>

                {/* Sleeve Allocations and Visual Allocation Bars */}
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/15 space-y-4">
                    <h3 className="font-extrabold text-sm tracking-wider uppercase text-outline flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">pie_chart</span>Sleeve Allocation Breakdown
                    </h3>
                    <div className="flex h-6 rounded-lg overflow-hidden border border-outline-variant/10">
                        {bots.map((b, idx) => {
                            const pct = totalAllocatedSum > 0 ? ((b.userSetting?.allocatedBalanceCents || 0) / totalAllocatedSum) * 100 : 25;
                            const colors = ['bg-[#FF79C6]', 'bg-[#50FA7B]', 'bg-[#F1FA8C]', 'bg-[#BD93F9]'];
                            return (
                                <div 
                                    key={b.id} 
                                    className={`${colors[idx % colors.length]} h-full transition-all flex items-center justify-center text-[10px] font-bold text-black truncate`} 
                                    style={{ width: `${pct}%` }}
                                >
                                    {b.name} ({pct.toFixed(0)}%)
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Portfolio Manager Sleeves Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {bots.map(bot => (
                        <div key={bot.id} className="glass-panel p-6 rounded-xl border border-outline-variant/15 flex flex-col space-y-4 hover:border-primary/30 transition-all hover:shadow-[0_0_25px_rgba(0,242,255,0.05)]">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <img src={bot.avatar} alt={bot.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shadow-inner" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-lg text-on-background">{bot.name}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                bot.risk === 'HIGH' ? 'bg-error/15 text-error border border-error/20' :
                                                bot.risk === 'MEDIUM' ? 'bg-warning/15 text-warning border border-warning/20' :
                                                'bg-success/15 text-success border border-success/20'
                                            }`}>
                                                {bot.risk} RISK
                                            </span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1 font-medium">{bot.strategy}</p>
                                        <button 
                                            onClick={() => handleTriggerCycle(bot.id)}
                                            disabled={runningCycles[bot.id]}
                                            className="mt-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer w-fit"
                                        >
                                            {runningCycles[bot.id] ? (
                                                <>
                                                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    EXECUTING...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[13px]">bolt</span>
                                                    RUN TRADING CYCLE
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-outline font-label-caps block">SLEEVE BALANCE</span>
                                    <span className="font-data-mono font-bold text-primary text-xl">${(((bot.userSetting?.allocatedBalanceCents || 0) + (bot.userSetting?.reservedBalanceCents || 0)) / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>

                             {/* Metrics Grid */}
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant/10 text-xs">
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Allocated Cash</span>
                                     <span className="block font-bold text-on-surface font-data-mono mt-0.5">
                                         ${((bot.userSetting?.allocatedBalanceCents || 0) / 100).toFixed(2)}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Reserved Cash</span>
                                     <span className="block font-bold text-on-surface font-data-mono mt-0.5">
                                         ${((bot.userSetting?.reservedBalanceCents || 0) / 100).toFixed(2)}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Exposure</span>
                                     <span className="block font-bold text-on-surface font-data-mono mt-0.5">
                                         ${((bot.userSetting?.exposureCents || 0) / 100).toFixed(2)}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Max Drawdown</span>
                                     <span className="block font-bold text-error font-data-mono mt-0.5">
                                         {bot.userSetting?.maxDrawdownPercent || 0}%
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Realized PnL</span>
                                     <span className={`block font-bold font-data-mono mt-0.5 ${((bot.userSetting?.realizedPnlCents || 0)) >= 0 ? 'text-emerald-400' : 'text-error'}`}>
                                         ${(((bot.userSetting?.realizedPnlCents || 0)) / 100).toFixed(2)}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Unrealized PnL</span>
                                     <span className={`block font-bold font-data-mono mt-0.5 ${((bot.userSetting?.unrealizedPnlCents || 0)) >= 0 ? 'text-cyan-400' : 'text-error'}`}>
                                         ${(((bot.userSetting?.unrealizedPnlCents || 0)) / 100).toFixed(2)}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Total Trades</span>
                                     <span className="block font-bold text-secondary font-data-mono mt-0.5">
                                         {bot.userSetting?.totalTrades || 0}
                                     </span>
                                 </div>
                                 <div>
                                     <span className="text-[9px] text-outline uppercase font-semibold">Win Rate</span>
                                     <span className="block font-bold text-emerald-400 font-data-mono mt-0.5">
                                         {bot.userSetting?.totalTrades ? (((bot.userSetting?.winningTrades || 0) / bot.userSetting.totalTrades) * 100).toFixed(0) : "0"}%
                                     </span>
                                 </div>
                             </div>

                            {/* User Delegation Settings */}
                            <div className="border-t border-b border-outline-variant/10 py-4 my-1 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-primary">person_add</span>
                                            Delegate My Trades
                                        </span>
                                        <span className="text-[10px] text-on-surface-variant ml-5">Allow {bot.name} to trade on my behalf</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={bot.userSetting?.enabled || false}
                                            onChange={(e) => handleToggleDelegation(bot.id, e.target.checked, bot.userSetting?.allocatedBalanceCents || 0)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e3e2e5] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                {bot.userSetting?.enabled && (
                                    <div className="flex gap-3 items-center justify-between bg-surface-container-low/50 p-2.5 rounded-lg border border-outline-variant/10 ml-5 animate-fade-in">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-outline font-label-caps">DELEGATED LIMIT</span>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-xs text-on-surface font-semibold">$</span>
                                                <input 
                                                    type="number"
                                                    value={editingAllocations[bot.id] !== undefined ? editingAllocations[bot.id] : (bot.userSetting?.allocatedBalanceCents || 0) / 100}
                                                    onChange={(e) => setEditingAllocations({ ...editingAllocations, [bot.id]: parseFloat(e.target.value) || 0 })}
                                                    className="w-24 bg-transparent text-xs text-on-surface font-semibold border-b border-outline focus:border-primary outline-none py-0.5 font-data-mono"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSaveAllocation(bot.id)}
                                            className="bg-primary/20 text-primary hover:bg-primary/30 active:scale-95 text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer border border-primary/30"
                                        >
                                            SAVE ALLOCATION
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Active Holdings */}
                            <div className="bg-surface-container/30 rounded-lg p-4 space-y-3">
                                <div className="text-[11px] text-outline font-label-caps flex justify-between border-b border-outline-variant/10 pb-2">
                                    <span>ACTIVE BOT HOLDINGS</span>
                                    <span>{bot.positions.length} HELD</span>
                                </div>
                                {bot.positions.length === 0 ? (
                                    <div className="text-xs text-on-surface-variant/60 py-2 text-center">No active positions</div>
                                ) : (
                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {bot.positions.map((pos, idx) => {
                                            const isProfit = (pos.currentProfitCents || 0) >= 0;
                                            const profitUsd = Math.abs((pos.currentProfitCents || 0) / 100);
                                            return (
                                                <div key={idx} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 space-y-2">
                                                    <div className="font-semibold text-on-surface text-xs leading-normal">
                                                        {pos.question || `Market #${pos.marketId.slice(-6)}`}
                                                    </div>
                                                    <div className="flex flex-wrap gap-y-1 gap-x-4 text-[10px] font-data-mono text-outline items-center">
                                                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${pos.outcome === 'YES' ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error'}`}>
                                                            {pos.outcome}
                                                        </span>
                                                        <span>Qty: <strong className="text-on-surface">{pos.quantity}</strong></span>
                                                        <span>Entry: <strong className="text-on-surface">{pos.avgBuyPrice}¢</strong></span>
                                                        <span>Current: <strong className="text-on-surface">{pos.currentPrice || 50}¢</strong></span>
                                                        <span className={isProfit ? 'text-emerald-400' : 'text-error'}>
                                                            PnL: <strong>{isProfit ? '+' : '-'}${profitUsd.toFixed(2)}</strong>
                                                        </span>
                                                        <span className={isProfit ? 'text-emerald-400' : 'text-error'}>
                                                            ROI: <strong>{isProfit ? '+' : ''}{(pos.roiPct || 0).toFixed(1)}%</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Double-Entry Ledger and Activity Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Double Entry Bookkeeping Table */}
                    <div className="glass-panel p-6 rounded-xl border border-outline-variant/15 flex flex-col space-y-4 overflow-hidden">
                        <div className="flex items-center gap-2 text-primary border-b border-outline-variant/10 pb-3">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            <h3 className="font-extrabold text-sm tracking-wider uppercase">Bookkeeper Accounting Ledger</h3>
                        </div>
                        <div className="overflow-x-auto max-h-72">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[10px] text-outline uppercase tracking-wider font-label-caps">
                                        <th className="py-2.5 px-3">Timestamp</th>
                                        <th className="py-2.5 px-3">Bot</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3 text-right">Debit</th>
                                        <th className="py-2.5 px-3 text-right">Credit</th>
                                        <th className="py-2.5 px-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10 text-on-surface font-data-mono">
                                    {ledger.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-outline-variant">No bookkeeping entries logged yet.</td>
                                        </tr>
                                    ) : (
                                        ledger.map((e: any) => (
                                            <tr key={e.id} className="hover:bg-surface-container-high/40 transition-colors">
                                                <td className="py-2 px-3 text-outline text-[10px]">{new Date(e.createdAt).toLocaleTimeString()}</td>
                                                <td className="py-2 px-3 font-semibold text-primary">{e.botId.replace("bot-", "").toUpperCase()}</td>
                                                <td className="py-2 px-3 text-[10px]"><span className="px-1.5 py-0.5 rounded bg-surface-container text-outline font-label-caps">{e.transactionType}</span></td>
                                                <td className="py-2 px-3 text-right text-emerald-400 font-bold">{e.debitCents > 0 ? `$${(e.debitCents / 100).toFixed(2)}` : "-"}</td>
                                                <td className="py-2 px-3 text-right text-error font-bold">{e.creditCents > 0 ? `$${(e.creditCents / 100).toFixed(2)}` : "-"}</td>
                                                <td className="py-2 px-3 text-outline text-[10px] truncate max-w-[120px]">{e.description}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Logs Terminal */}
                    <div className="glass-panel p-6 rounded-xl border border-outline-variant/15 flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined text-xl">terminal</span>
                                <h3 className="font-extrabold text-sm tracking-wider uppercase">Live Activity Terminal Logs</h3>
                            </div>
                            <span className="text-[10px] text-outline font-data-mono">POLLING: EVERY 5S</span>
                        </div>

                        <div className="bg-black/80 rounded-lg p-4 font-data-mono text-xs leading-relaxed space-y-2 h-72 overflow-y-auto shadow-inner flex flex-col-reverse custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="text-on-surface-variant/40 text-center py-12">Waiting for agent activity logs...</div>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} className="flex gap-2 items-start py-0.5 border-b border-white/5 last:border-b-0 animate-fade-in">
                                        <span className="text-outline font-semibold select-none flex-shrink-0">
                                            [{new Date(log.timestamp).toLocaleTimeString()}]
                                        </span>
                                        <span className={`font-bold flex-shrink-0 ${
                                            log.bot === 'System' ? 'text-primary' :
                                            log.bot.startsWith('Alice') ? 'text-[#FF79C6]' :
                                            log.bot.startsWith('Bob') ? 'text-[#50FA7B]' :
                                            log.bot.startsWith('Charlie') ? 'text-[#F1FA8C]' :
                                            'text-[#BD93F9]'
                                        }`}>
                                            {log.bot}:
                                        </span>
                                        <span className="text-[#f8f8f2]">{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AiTrading;
