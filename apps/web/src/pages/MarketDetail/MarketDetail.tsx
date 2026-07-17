import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolioState } from '../../hooks/usePortfolioState';
import './MarketDetail.css';
import { AIInsightsCard } from '../../components/AI/AIInsightsCard';
import { AIChatbotWidget } from '../../components/AI/AIChatbotWidget';
import { MarketIntelligencePanel } from '../../components/AI/MarketIntelligencePanel';
import { Header } from '../../components/Header/Header';
import { MarketHeader } from './MarketHeader';
import { ChartCard } from './ChartCard';
import { OrderbookTab } from './OrderbookTab';
import { TradeCard } from './TradeCard';
import { AboutMarketAccordions } from './AboutMarketAccordions';
import { MOCK_MARKET } from './marketDetailHelpers';

const MarketDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { isLoggedIn, session, refetchBalance, publicKey } = useAuth();
    const { availableCash } = usePortfolioState();
    const balance = availableCash * 100;
    const marketId = id || MOCK_MARKET.id;

    const [market, setMarket] = useState<any | null>(null);
    const [orderbook, setOrderbook] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [userPositions, setUserPositions] = useState<any[]>([]);
    const [loadingTrade, setLoadingTrade] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [openAccordion, setOpenAccordion] = useState<string | null>('about');
    const [actionTab, setActionTab] = useState<'trade' | 'mint'>('trade');
    const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
    const [tradeSide, setTradeSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
    
    const [priceInput, setPriceInput] = useState<string>("0.34");
    const [quantityInput, setQuantityInput] = useState<string>("");

    const currentPosition = userPositions.find(p => p.marketId === marketId && p.outcome === outcome);
    const sharesHeld = currentPosition ? currentPosition.quantity : 0;

    const fetchData = async () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        try {
            const marketRes = await fetch(`${API_URL}/api/market?id=${marketId}`);
            if (marketRes.ok) setMarket(await marketRes.json());

            const obRes = await fetch(`${API_URL}/api/orderbook?marketId=${marketId}`);
            if (obRes.ok) setOrderbook(await obRes.json());

            const chartRes = await fetch(`${API_URL}/api/charts?marketId=${marketId}&range=5d`);
            if (chartRes.ok) setChartData(await chartRes.json());

            if (isLoggedIn && session?.access_token) {
                const posRes = await fetch(`${API_URL}/api/positions`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (posRes.ok) setUserPositions(await posRes.json());
            }
        } catch (err) {
            console.error("Error fetching market detail components:", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [marketId, session?.access_token, isLoggedIn]);

    const handlePlaceOrder = async () => {
        if (!isLoggedIn || !session?.access_token) { navigate('/login'); return; }
        const qty = parseInt(quantityInput);
        const price = parseFloat(priceInput);

        if (isNaN(qty) || qty <= 0) { setErrorMessage("Quantity must be greater than 0"); return; }
        if (isNaN(price) || price <= 0 || price >= 1.0) { setErrorMessage("Price must be between 0.01 and 0.99"); return; }
        if (tradeSide === 'SELL' && qty > sharesHeld) { setErrorMessage("You cannot sell more than the purchased stocks"); return; }

        setLoadingTrade(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        try {
            const response = await fetch(tradeSide === 'BUY' ? `${API_URL}/api/buy` : `${API_URL}/api/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ marketId, outcome, price: Math.round(price * 100), quantity: qty })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to place order');
            setSuccessMessage(`Order placed successfully! Status: ${data.status}`);
            setQuantityInput("");
            fetchData();
            refetchBalance();
        } catch (err: any) {
            setErrorMessage(err.message || "An unexpected error occurred");
        } finally {
            setLoadingTrade(false);
        }
    };

    useEffect(() => {
        if (market) setPriceInput((outcome === 'YES' ? market.yesPrice / 100 : market.noPrice / 100).toString());
    }, [market, outcome]);

    useEffect(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
    }, [outcome, tradeSide, orderType]);

    const activeOutcome = outcome.toLowerCase() as 'yes' | 'no';
    const asksList = orderbook?.[activeOutcome]?.asks || [];
    const bidsList = orderbook?.[activeOutcome]?.bids || [];
    const maxQty = Math.max(...asksList.map((a: any) => a.quantity), ...bidsList.map((b: any) => b.quantity), 1);

    const displayAsks = asksList.length > 0 ? asksList.map((a: any) => ({ price: a.price / 100, size: a.quantity >= 1000 ? `${(a.quantity / 1000).toFixed(1)}K` : a.quantity.toString(), percentage: (a.quantity / maxQty) * 100 })) : MOCK_MARKET.orderbook.asks;
    const displayBids = bidsList.length > 0 ? bidsList.map((b: any) => ({ price: b.price / 100, size: b.quantity >= 1000 ? `${(b.quantity / 1000).toFixed(1)}K` : b.quantity.toString(), percentage: (b.quantity / maxQty) * 100 })) : MOCK_MARKET.orderbook.bids;
    const spreadCents = (asksList[0]?.price && bidsList[0]?.price) ? (asksList[0].price - bidsList[0].price) : 1;
    const spreadText = asksList.length > 0 && bidsList.length > 0 ? `${(spreadCents / 100).toFixed(2)} (${((spreadCents / asksList[0].price) * 100).toFixed(1)}%)` : MOCK_MARKET.orderbook.spread;
    const lastPriceText = market ? `${(outcome === 'YES' ? market.yesPrice : market.noPrice)}¢` : MOCK_MARKET.orderbook.lastPrice;

    return (
        <div className="bg-surface-dim selection:bg-primary-container selection:text-on-primary text-[#e3e2e5] min-h-screen font-body-md market-detail-container">
            <Header />
            <main className="pt-24 px-8 pb-12 grid grid-cols-12 gap-6 max-w-container-max mx-auto">
                <section className="col-span-12 lg:col-span-7 space-y-6">
                    <MarketHeader market={market} mockMarket={MOCK_MARKET} />
                    <ChartCard market={market} mockMarket={MOCK_MARKET} chartData={chartData} />
                    <AIInsightsCard marketId={marketId} />
                    <MarketIntelligencePanel marketId={marketId} />
                    <AboutMarketAccordions openAccordion={openAccordion} toggleAccordion={id => setOpenAccordion(openAccordion === id ? null : id)} mockMarket={MOCK_MARKET} />
                </section>
                <section className="col-span-12 md:col-span-6 lg:col-span-2 space-y-4">
                    <OrderbookTab 
                        outcome={outcome} 
                        setOutcome={setOutcome} 
                        orderbook={orderbook} 
                        mockMarket={MOCK_MARKET} 
                        setPriceInput={setPriceInput} 
                        spreadText={spreadText} 
                        lastPriceText={lastPriceText} 
                        displayAsks={displayAsks} 
                        displayBids={displayBids} 
                        recentOrders={orderbook?.recentOrders}
                        currentUserWallet={publicKey || undefined}
                    />
                </section>
                <section className="col-span-12 md:col-span-6 lg:col-span-3 space-y-4">
                    <TradeCard actionTab={actionTab} setActionTab={setActionTab} outcome={outcome} setOutcome={setOutcome} tradeSide={tradeSide} setTradeSide={setTradeSide} orderType={orderType} setOrderType={setOrderType} balance={balance} isLoggedIn={isLoggedIn} sharesHeld={sharesHeld} priceInput={priceInput} setPriceInput={setPriceInput} quantityInput={quantityInput} setQuantityInput={setQuantityInput} errorMessage={errorMessage} successMessage={successMessage} loadingTrade={loadingTrade} onPlaceOrder={handlePlaceOrder} />
                </section>
            </main>
            <AIChatbotWidget marketId={marketId} />
        </div>
    );
};

export default MarketDetail;
