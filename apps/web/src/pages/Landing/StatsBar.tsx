import React from 'react';

export const StatsBar: React.FC = () => {
  return (
    <section className="bg-surface-container-lowest border-y border-outline-variant/30 py-8 animate-fade-in">
      <div className="max-w-container-max mx-auto px-margin-desktop flex flex-wrap justify-between gap-8 md:gap-16">
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Total Volume Traded</span>
          <span className="font-headline-md text-headline-md text-primary font-bold font-data-mono">$12,482,901+</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Active Markets</span>
          <span className="font-headline-md text-headline-md text-primary font-bold font-data-mono">450+</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Total Traders</span>
          <span className="font-headline-md text-headline-md text-primary font-bold font-data-mono">15,204</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Network Status</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-headline-md text-headline-md text-secondary font-bold uppercase tracking-tight">Healthy</span>
          </div>
        </div>
      </div>
    </section>
  );
};
