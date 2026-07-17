import React from 'react';
import { TradeSummary } from './TradeSummary';

interface TradeCardProps {
  actionTab: 'trade' | 'mint';
  setActionTab: (val: 'trade' | 'mint') => void;
  outcome: 'YES' | 'NO';
  setOutcome: (val: 'YES' | 'NO') => void;
  tradeSide: 'BUY' | 'SELL';
  setTradeSide: (val: 'BUY' | 'SELL') => void;
  orderType: 'LIMIT' | 'MARKET';
  setOrderType: (val: 'LIMIT' | 'MARKET') => void;
  balance: number | undefined;
  isLoggedIn: boolean;
  sharesHeld: number;
  priceInput: string;
  setPriceInput: (val: string) => void;
  quantityInput: string;
  setQuantityInput: (val: string) => void;
  errorMessage: string | null;
  successMessage: string | null;
  loadingTrade: boolean;
  onPlaceOrder: () => void;
}

export const TradeCard: React.FC<TradeCardProps> = ({
  actionTab,
  setActionTab,
  outcome,
  setOutcome,
  tradeSide,
  setTradeSide,
  orderType,
  setOrderType,
  balance,
  isLoggedIn,
  sharesHeld,
  priceInput,
  setPriceInput,
  quantityInput,
  setQuantityInput,
  errorMessage,
  successMessage,
  loadingTrade,
  onPlaceOrder
}) => {
  const price = parseFloat(priceInput) || 0;
  const qty = parseInt(quantityInput) || 0;
  const totalCost = (price * qty).toFixed(2);
  const maxPayout = qty.toFixed(2);
  const maxProfit = (qty - (price * qty)).toFixed(2);
  const profitPercentage = price > 0 ? (((1 - price) / price) * 100).toFixed(0) : 0;

  return (
    <div className="glass-panel rounded-xl market-detail-metallic-border flex flex-col sticky top-24 animate-fade-in text-sm text-[#e3e2e5]">
      <div className="flex border-b border-outline-variant/20">
        <button className={`flex-1 py-4 text-xs font-bold cursor-pointer ${actionTab === 'trade' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} onClick={() => setActionTab('trade')}>TRADE</button>
        <button className={`flex-1 py-4 text-xs font-bold cursor-pointer ${actionTab === 'mint' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} onClick={() => setActionTab('mint')}>MINT / REDEEM</button>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {['YES', 'NO'].map(out => (
            <button key={out} className={`py-3 rounded-lg flex flex-col items-center transition-all cursor-pointer ${outcome === out ? `border-2 ${out === 'YES' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-error bg-error/5 text-error'} font-bold` : `border border-outline-variant/30 text-on-surface-variant`}`} onClick={() => setOutcome(out as any)}>
              <span className="text-[10px] uppercase opacity-60">Outcome</span>
              <span>{out}</span>
            </button>
          ))}
        </div>
        
        {isLoggedIn && (
          <div className="flex justify-between items-center bg-surface-container-low/40 py-2.5 px-4 rounded-xl border border-outline-variant/10 text-xs">
            <span className="text-[#8e8d91] font-semibold uppercase tracking-wider text-[10px]">Your Shares Held</span>
            <span className="font-data-mono font-bold text-primary text-sm">{sharesHeld} {outcome}</span>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex bg-surface-container rounded-lg p-1">
            <button className={`flex-1 py-2 text-xs font-bold rounded cursor-pointer ${tradeSide === 'BUY' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`} onClick={() => setTradeSide('BUY')}>BUY</button>
            <button className={`flex-1 py-2 text-xs font-medium rounded cursor-pointer ${tradeSide === 'SELL' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`} onClick={() => setTradeSide('SELL')}>SELL</button>
          </div>
          <div className="flex gap-4 border-b border-outline-variant/10 pb-2">
            <button className={`text-xs px-1 cursor-pointer ${orderType === 'LIMIT' ? 'font-bold text-primary border-b-2 border-primary' : 'font-medium text-on-surface-variant hover:text-on-surface'}`} onClick={() => setOrderType('LIMIT')}>Limit</button>
            <button className={`text-xs px-1 cursor-pointer ${orderType === 'MARKET' ? 'font-bold text-primary border-b-2 border-primary' : 'font-medium text-on-surface-variant hover:text-on-surface'}`} onClick={() => setOrderType('MARKET')}>Market</button>
          </div>
        </div>
        
        <div className="space-y-4">
          {orderType === 'LIMIT' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Price</span>
                <span>Balance: {isLoggedIn ? (balance !== undefined ? `$${(balance / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}` : "Loading...") : "$0.00"}</span>
              </div>
              <div className="relative">
                <input className="w-full bg-surface-container border border-outline-variant/30 rounded-lg py-3 px-4 text-on-surface font-data-mono focus:border-primary-container outline-none transition-all" type="number" step="0.01" min="0.01" max="0.99" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">USD</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Quantity</span>
              {tradeSide === 'SELL' && isLoggedIn && <span className={`${sharesHeld === 0 ? 'text-error' : 'text-secondary'} font-semibold`}>Available: {sharesHeld} SHARES</span>}
            </div>
            <div className="relative">
              <input className={`w-full bg-surface-container border ${tradeSide === 'SELL' && qty > sharesHeld ? 'border-error/50 focus:border-error' : 'border-outline-variant/30 focus:border-primary-container'} rounded-lg py-3 px-4 text-on-surface font-data-mono outline-none transition-all`} placeholder="0" type="number" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">SHARES</span>
            </div>
            {tradeSide === 'SELL' && qty > sharesHeld && <span className="text-error text-xs block mt-1 font-semibold">⚠️ You cannot sell more than the purchased stocks</span>}
          </div>
        </div>
        
        <TradeSummary price={price} totalCost={totalCost} maxPayout={maxPayout} maxProfit={maxProfit} profitPercentage={profitPercentage} />

        {errorMessage && <div className="bg-error/15 text-error border border-error/25 p-3 rounded-lg text-xs font-semibold text-center leading-relaxed">⚠️ {errorMessage}</div>}
        {successMessage && <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 p-3 rounded-lg text-xs font-semibold text-center leading-relaxed animate-pulse">✓ {successMessage}</div>}
        
        <button onClick={onPlaceOrder} disabled={loadingTrade} className={`w-full py-4 font-extrabold rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${outcome === 'YES' ? 'bg-primary-container text-on-primary-container' : 'bg-error text-[#40000d]'}`}>
          {loadingTrade ? <><div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>PLACING ORDER...</> : (isLoggedIn ? 'PLACE ORDER' : 'LOGIN TO TRADE')}
        </button>
      </div>
    </div>
  );
};
