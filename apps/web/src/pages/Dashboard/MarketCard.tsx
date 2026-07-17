import React from 'react';

interface MarketCardProps {
  market: any;
  onNavigate: () => void;
}

export const MarketCard: React.FC<MarketCardProps> = React.memo(({ market, onNavigate }) => {
  return (
    <div 
      className={`glass-panel rounded-xl p-5 hover:shadow-[0_8px_30px_rgba(0,242,255,0.05)] transition-all flex flex-col group cursor-pointer ${market.borderClass} animate-fade-in`} 
      onClick={onNavigate}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] text-on-${market.categoryColor} bg-${market.categoryColor} px-2 py-0.5 rounded font-label-caps`}>{market.category}</span>
        <span className="text-xs text-outline font-data-mono">Ends {market.endDate}</span>
      </div>
      <h4 className="font-market-question text-lg text-on-surface mb-6 group-hover:text-primary transition-colors">{market.title}</h4>
      <div className="h-16 w-full mb-6 relative overflow-hidden flex items-end">
        <svg className="w-full h-full" viewBox="0 0 200 60">
          {market.grad === "" ? (
            <path d="M0 10 Q 40 20, 80 40 T 160 50 T 200 55" fill="none" stroke={market.svgStroke} strokeWidth="2"></path>
          ) : (
            <>
              <path d="M0 50 Q 25 40, 50 45 T 100 20 T 150 35 T 200 10" fill="none" stroke={market.svgStroke} strokeWidth="2"></path>
              <path d="M0 50 Q 25 40, 50 45 T 100 20 T 150 35 T 200 10 V 60 H 0 Z" fill={`url(#${market.grad})`}></path>
              <defs>
                <linearGradient id={market.grad} x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(0, 242, 255, 0.1)', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: 'rgba(0, 242, 255, 0)', stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
            </>
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline font-label-caps">VOLUME</span>
          <span className="text-sm font-data-mono text-on-surface">{market.volume}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-outline font-label-caps">CHANCE</span>
          <span className="text-sm font-data-mono text-primary">{market.chance}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="bg-[#003824] hover:bg-[#005236] text-secondary border border-secondary/20 py-3 rounded-lg font-bold transition-all active:scale-95 flex flex-col items-center cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
        >
          <span className="text-xs font-label-caps mb-1">YES</span>
          <span className="text-lg">{market.yesPrice}</span>
        </button>
        <button 
          className="bg-[#67001b] hover:bg-[#92002a] text-error border border-error/20 py-3 rounded-lg font-bold transition-all active:scale-95 flex flex-col items-center cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
        >
          <span className="text-xs font-label-caps mb-1">NO</span>
          <span className="text-lg">{market.noPrice}</span>
        </button>
      </div>
    </div>
  );
});

MarketCard.displayName = "MarketCard";
