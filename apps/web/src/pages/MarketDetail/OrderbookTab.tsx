import React from 'react';

interface OrderbookTabProps {
  outcome: 'YES' | 'NO';
  setOutcome: (val: 'YES' | 'NO') => void;
  orderbook: any;
  mockMarket: any;
  setPriceInput: (val: string) => void;
  spreadText: string;
  lastPriceText: string;
  displayAsks: any[];
  displayBids: any[];
  recentOrders?: any[];
  currentUserWallet?: string;
}

export const OrderbookTab: React.FC<OrderbookTabProps> = ({
  outcome,
  setOutcome,
  setPriceInput,
  spreadText,
  lastPriceText,
  displayAsks,
  displayBids,
  recentOrders,
  currentUserWallet
}) => {
  return (
    <div className="glass-panel h-full rounded-xl flex flex-col market-detail-metallic-border animate-fade-in text-[#e3e2e5]">
      <div className="p-4 border-b border-outline-variant/20">
        <h3 className="text-label-caps uppercase tracking-widest text-on-surface mb-4">Orderbook</h3>
        <div className="flex p-1 bg-surface-container rounded-lg">
          <button 
            onClick={() => setOutcome('YES')}
            className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer ${outcome === 'YES' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            YES
          </button>
          <button 
            onClick={() => setOutcome('NO')}
            className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer ${outcome === 'NO' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            NO
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 space-y-1">
          <div className="grid grid-cols-2 text-[10px] text-on-surface-variant px-2 pb-1">
            <span>PRICE</span>
            <span className="text-right">SIZE</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {displayAsks.map((ask: any, idx: number) => (
              <div key={idx} className="relative group cursor-pointer" onClick={() => setPriceInput(ask.price.toString())}>
                <div className="absolute inset-0 bg-error/10 right-0" style={{ width: `${ask.percentage}%` }}></div>
                <div className="relative grid grid-cols-2 px-2 py-1 text-data-mono text-xs">
                  <span className="text-error">{ask.price.toFixed(2)}</span>
                  <span className="text-right">{ask.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-surface-container py-2 px-4 border-y border-outline-variant/10 flex justify-between items-center">
          <span className="text-[10px] text-on-surface-variant font-medium">SPREAD</span>
          <span className="text-data-mono text-xs text-on-surface">{spreadText}</span>
        </div>
 
        <div className="p-2 space-y-1">
          <div className="flex flex-col gap-0.5">
            {displayBids.map((bid: any, idx: number) => (
              <div key={idx} className="relative group cursor-pointer" onClick={() => setPriceInput(bid.price.toString())}>
                <div className="absolute inset-0 bg-secondary/10 left-0" style={{ width: `${bid.percentage}%` }}></div>
                <div className="relative grid grid-cols-2 px-2 py-1 text-data-mono text-xs">
                  <span className="text-secondary font-bold">{bid.price.toFixed(2)}</span>
                  <span className="text-right">{bid.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Order Queue */}
      <div className="border-t border-outline-variant/15 p-4 bg-surface-container-low/10">
        <h4 className="text-[10px] text-outline font-label-caps mb-3 tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-primary animate-pulse font-bold">flowsheet</span>
          Live Order Queue
        </h4>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((ord: any, idx: number) => {
              const isCurrentUser = ord.wallet === currentUserWallet;
              
              // Map Bot addresses to friendly names
              let displayName = `${ord.wallet.substring(0, 4)}...${ord.wallet.substring(ord.wallet.length - 4)}`;
              if (isCurrentUser) {
                displayName = "You (DemoUser)";
              } else if (ord.wallet === "AquKi58ctfgm1cB9b93qNXrKtm9ABEqHqeLfyYZPSkDr") {
                displayName = "Market Maker";
              } else if (ord.wallet === "H6ARqC5KxKzL4vUoE8f7m4pAByrTugnQDnLJupMb29kgc") {
                displayName = "AliceBot";
              } else if (ord.wallet === "G5tP8RHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc") {
                displayName = "BobBot";
              } else if (ord.wallet === "J89RzPAHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc") {
                displayName = "CharlieBot";
              } else if (ord.wallet === "84P3R7AHgh6reTNEDNVV8NpYqUb5iyBYvLJupMb29kgc") {
                displayName = "EdBot";
              }

              return (
                <div key={idx} className="flex justify-between items-center text-[10px] bg-surface-container-low/30 py-1.5 px-2 rounded border border-outline-variant/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${ord.side === 'BUY' ? 'bg-secondary' : 'bg-error'}`}></span>
                    <span className={`font-semibold ${isCurrentUser ? 'text-primary font-bold' : 'text-on-surface'}`}>{displayName}</span>
                  </div>
                  <div className="font-data-mono text-outline-variant">
                    {ord.side} {ord.quantity} {ord.outcome} @ {(ord.price / 100).toFixed(2)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-[9px] text-outline text-center py-4">No active orders in queue</div>
          )}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-outline-variant/20">
        <div className="flex justify-between text-[10px] text-on-surface-variant">
          <span>LAST PRICE</span>
          <span className="text-secondary">{lastPriceText}</span>
        </div>
      </div>
    </div>
  );
};
