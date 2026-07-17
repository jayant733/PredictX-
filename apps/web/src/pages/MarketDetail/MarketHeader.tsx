import React from 'react';

interface MarketHeaderProps {
  market: any;
  mockMarket: any;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({ market, mockMarket }) => {
  const category = market ? market.category.toUpperCase() : mockMarket.category.toUpperCase();
  const title = market ? market.question : mockMarket.title;
  const endDate = market 
    ? new Date(market.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    : mockMarket.endDate;
  const volume = market 
    ? `$${(market.volumeUsd / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
    : mockMarket.volume;

  return (
    <>
      <nav className="flex items-center gap-2 text-label-caps text-on-surface-variant uppercase tracking-widest">
        <a className="hover:text-primary" href="/dashboard">Markets</a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary/70">{category}</span>
      </nav>

      <div className="space-y-2 animate-fade-in">
        <h1 className="font-display-lg text-display-lg leading-tight text-on-surface">{title}</h1>
        <div className="flex items-center gap-4 text-on-surface-variant text-sm">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_today</span> Ends {endDate}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bar_chart</span> {volume} Volume
          </span>
        </div>
      </div>
    </>
  );
};
