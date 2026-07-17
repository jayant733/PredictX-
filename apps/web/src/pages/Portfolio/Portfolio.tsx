import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolioState } from '../../hooks/usePortfolioState';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { enrichPositions, enrichPendingOrders, enrichTransactionHistory, formatCurrency } from './portfolioHelpers';
import { PositionsTable } from './PositionsTable';
import { OrdersTable } from './OrdersTable';
import { HistoryTable } from './HistoryTable';
import { AIAdvisorCard } from './AIAdvisorCard';
import './Portfolio.css';

const Portfolio: React.FC = () => {
    const { isLoggedIn, loading, session } = useAuth();
    const { totalEquity, availableCash, marketValue } = usePortfolioState();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'active' | 'orders' | 'history'>('active');
    const [isLoaded, setIsLoaded] = useState(false);

    const [activePositions, setActivePositions] = useState<any[]>([]);
    const [openOrders, setOpenOrders] = useState<any[]>([]);
    const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [auditResult, setAuditResult] = useState<any | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const fetchPortfolioDetails = async () => {
        if (!isLoggedIn || !session?.access_token) return;
        try {
            const marketsRes = await fetch(`${API_URL}/api/markets`);
            const marketsData = marketsRes.ok ? await marketsRes.json() : [];

            const posRes = await fetch(`${API_URL}/api/positions`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const posData = posRes.ok ? await posRes.json() : [];

            const histRes = await fetch(`${API_URL}/api/history`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const histData = histRes.ok ? await histRes.json() : [];

            setActivePositions(enrichPositions(posData, marketsData));
            setOpenOrders(enrichPendingOrders(histData, marketsData));
            setTransactionHistory(enrichTransactionHistory(histData, marketsData));
        } catch (err) {
            console.error("Failed to load portfolio details:", err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchPortfolioDetails();
            const interval = setInterval(fetchPortfolioDetails, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, session]);

    const handleRequestAudit = async () => {
        setLoadingAudit(true);
        try {
            const response = await fetch(`${API_URL}/api/ai/portfolio/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) setAuditResult(await response.json());
        } catch (err) {
            console.error("Failed to fetch AI portfolio audit:", err);
        } finally {
            setLoadingAudit(false);
        }
    };

    useEffect(() => {
        if (!loading && !isLoggedIn) navigate('/login');
    }, [loading, isLoggedIn, navigate]);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const calculatedTotalNetWorth = totalEquity;
    const cashBalance = availableCash;
    const assetBalance = marketValue;

    const totalCurrentValue = activePositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalCostBasis = activePositions.reduce((sum, pos) => sum + (pos.shares * pos.avgBuy), 0);
    const netPnL = totalCurrentValue - totalCostBasis;
    
    const allTimePnL = { amount: Math.abs(netPnL), isPositive: netPnL >= 0 };
    const dailyPnL = {
        amount: Math.abs(netPnL * 0.15),
        percentage: totalCostBasis > 0 ? ((netPnL * 0.15) / totalCostBasis * 100).toFixed(1) : '0.0',
        isPositive: netPnL >= 0
    };

    return (
        <div className="bg-[#0A0B0D] text-[#e3e2e5] font-body-md text-body-md min-h-screen selection:bg-primary-container selection:text-on-primary">
            <Header />
            <Sidebar />

            <main className="md:ml-64 pt-24 px-margin-mobile md:px-margin-desktop pb-20 max-w-container-max mx-auto">
                <section className="portfolio-glass-card rounded-xl p-8 mb-8 relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(10px)' }}>
                    <div className="absolute top-0 right-0 w-1/2 h-full portfolio-chart-gradient pointer-events-none opacity-40"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <h1 className="text-on-surface-variant font-label-caps text-label-caps mb-2">TOTAL PORTFOLIO VALUE</h1>
                            <div className="font-display-lg text-display-lg text-primary portfolio-neon-glow tracking-tight mb-4">{formatCurrency(calculatedTotalNetWorth)}</div>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex flex-col">
                                    <span className="text-on-surface-variant text-xs font-label-caps">24h P&amp;L</span>
                                    <span className={`font-bold ${dailyPnL.isPositive ? 'text-secondary' : 'text-error'}`}>
                                        {dailyPnL.isPositive ? '+' : '-'}{formatCurrency(dailyPnL.amount)} ({dailyPnL.isPositive ? '+' : '-'}{dailyPnL.percentage}%)
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-outline-variant/30 pl-6">
                                    <span className="text-on-surface-variant text-xs font-label-caps">ALL-TIME P&amp;L</span>
                                    <span className={`font-bold ${allTimePnL.isPositive ? 'text-secondary' : 'text-error'}`}>
                                        {allTimePnL.isPositive ? '+' : '-'}{formatCurrency(allTimePnL.amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-auto flex flex-col items-end gap-4">
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="flex-1 md:flex-none portfolio-glass-card bg-surface-container-low p-4 rounded-lg border-l-4 border-primary">
                                    <div className="text-on-surface-variant text-xs font-label-caps mb-1">CASH BALANCE</div>
                                    <div className="font-data-mono text-on-surface">{formatCurrency(cashBalance)}</div>
                                </div>
                                <div className="flex-1 md:flex-none portfolio-glass-card bg-surface-container-low p-4 rounded-lg border-l-4 border-secondary">
                                    <div className="text-on-surface-variant text-xs font-label-caps mb-1">ASSET BALANCE</div>
                                    <div className="font-data-mono text-on-surface">{formatCurrency(assetBalance)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <AIAdvisorCard auditResult={auditResult} loadingAudit={loadingAudit} onRequestAudit={handleRequestAudit} />

                <div className="mb-6 flex gap-8 border-b border-outline-variant/20 overflow-x-auto">
                    {(['active', 'orders', 'history'] as const).map(tab => (
                        <button key={tab} className={`pb-4 font-label-caps text-label-caps transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'} cursor-pointer`} onClick={() => setActiveTab(tab)}>
                            {tab === 'active' ? 'ACTIVE POSITIONS' : tab === 'orders' ? 'OPEN ORDERS' : 'TRANSACTION HISTORY'}
                        </button>
                    ))}
                </div>

                {activeTab === 'active' && <PositionsTable activePositions={activePositions} formatCurrency={formatCurrency} onNavigate={id => navigate(`/market/${id}`)} />}
                {activeTab === 'orders' && <OrdersTable openOrders={openOrders} formatCurrency={formatCurrency} />}
                {activeTab === 'history' && <HistoryTable transactionHistory={transactionHistory} />}
            </main>
        </div>
    );
};

export default Portfolio;
