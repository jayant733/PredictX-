import React from 'react';

interface LiveMarketsProps {
  onTradeClick: (marketId: string) => void;
}

export const LiveMarkets: React.FC<LiveMarketsProps> = ({ onTradeClick }) => {
  return (
    <section className="py-24 px-margin-desktop max-w-container-max mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-display-lg text-headline-md text-primary mb-2">Live Markets</h2>
          <p className="text-on-surface-variant max-w-md">The most liquid prediction pools globally, updated in real-time.</p>
        </div>
        <button 
          onClick={() => onTradeClick('dashboard')}
          className="text-primary font-label-caps text-label-caps uppercase flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          View All Markets <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Market Card 1 */}
        <div className="landing-glass-panel landing-metallic-border p-6 rounded-xl group hover:border-primary/50 transition-all cursor-pointer animate-fade-in" onClick={() => onTradeClick('market/btc-100k')}>
          <div className="flex justify-between mb-4">
            <span className="font-label-caps text-label-caps bg-surface-container px-2 py-1 rounded text-on-surface-variant uppercase">Crypto</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bar_chart</span> $4.2M Vol
            </span>
          </div>
          <h3 className="font-market-question text-market-question text-on-surface mb-6 group-hover:text-primary transition-colors">
            Will Bitcoin (BTC) hit $100,000 before December 31, 2024?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-[#1A2E26] text-secondary border border-secondary/30 py-3 rounded-lg font-bold hover:bg-secondary/20 transition-all flex flex-col items-center">
              <span>YES</span>
              <span className="font-data-mono text-xs opacity-80">$0.64</span>
            </button>
            <button className="bg-[#2D1A1D] text-error border border-error/30 py-3 rounded-lg font-bold hover:bg-error/20 transition-all flex flex-col items-center">
              <span>NO</span>
              <span className="font-data-mono text-xs opacity-80">$0.36</span>
            </button>
          </div>
        </div>

        {/* Market Card 2 */}
        <div className="landing-glass-panel landing-metallic-border p-6 rounded-xl group hover:border-primary/50 transition-all cursor-pointer animate-fade-in" onClick={() => onTradeClick('market/us-election')}>
          <div className="flex justify-between mb-4">
            <span className="font-label-caps text-label-caps bg-surface-container px-2 py-1 rounded text-on-surface-variant uppercase">Politics</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bar_chart</span> $8.1M Vol
            </span>
          </div>
          <h3 className="font-market-question text-market-question text-on-surface mb-6 group-hover:text-primary transition-colors">
            Who will win the 2024 US Presidential Election?
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-primary/50 cursor-pointer bg-surface/40">
              <span className="font-body-md">Donald Trump</span>
              <span className="font-data-mono text-secondary font-bold">52%</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-primary/50 cursor-pointer bg-surface/40">
              <span className="font-body-md">Kamala Harris</span>
              <span className="font-data-mono text-secondary font-bold">48%</span>
            </div>
          </div>
        </div>

        {/* Market Card 3 */}
        <div className="landing-glass-panel landing-metallic-border p-6 rounded-xl group hover:border-primary/50 transition-all cursor-pointer animate-fade-in" onClick={() => onTradeClick('market/fed-rate')}>
          <div className="flex justify-between mb-4">
            <span className="font-label-caps text-label-caps bg-surface-container px-2 py-1 rounded text-on-surface-variant uppercase">Economics</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bar_chart</span> $1.5M Vol
            </span>
          </div>
          <h3 className="font-market-question text-market-question text-on-surface mb-6 group-hover:text-primary transition-colors">
            Will the Fed announce a rate cut in their next meeting?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-[#1A2E26] text-secondary border border-secondary/30 py-3 rounded-lg font-bold hover:bg-secondary/20 transition-all flex flex-col items-center">
              <span>YES</span>
              <span className="font-data-mono text-xs opacity-80">$0.82</span>
            </button>
            <button className="bg-[#2D1A1D] text-error border border-error/30 py-3 rounded-lg font-bold hover:bg-error/20 transition-all flex flex-col items-center">
              <span>NO</span>
              <span className="font-data-mono text-xs opacity-80">$0.18</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
