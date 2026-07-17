import React from 'react';

interface HeroSectionProps {
  onConnectClick: () => void;
  onViewMarketsClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onConnectClick, onViewMarketsClick }) => {
  return (
    <section className="relative min-h-[921px] flex items-center overflow-hidden landing-grid-pattern animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-surface"></div>
      <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 w-fit">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-caps text-label-caps text-secondary uppercase">Live on Solana Mainnet</span>
          </div>
          <h1 className="font-display-lg text-display-lg lg:text-[72px] lg:leading-[80px] text-primary landing-neon-glow-text max-w-xl">
            Trade Your Opinions. Shape the Future.
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-lg">
            The institutional-grade prediction market for politics, crypto, and global events. Precision tools for modern forecasters.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onConnectClick}
              className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-headline-md text-headline-md hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] cursor-pointer"
            >
              Start Trading
            </button>
            <button 
              onClick={onViewMarketsClick}
              className="landing-metallic-border text-primary px-8 py-4 rounded-xl font-headline-md text-headline-md hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              View Markets
            </button>
          </div>
        </div>
        <div className="relative hidden lg:block landing-animate-float">
          <div className="landing-glass-panel border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="font-label-caps text-label-caps text-on-surface-variant">PREDICTED PROBABILITY</div>
                <div className="font-display-lg text-display-lg text-secondary">84.2%</div>
              </div>
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-outline-variant rounded-full"></span>
                <span className="w-1 h-6 bg-outline-variant rounded-full"></span>
                <span className="w-1 h-8 bg-secondary rounded-full"></span>
                <span className="w-1 h-10 bg-secondary rounded-full"></span>
              </div>
            </div>
            <div className="h-64 flex items-end gap-2">
              <div className="flex-1 bg-outline-variant/20 rounded-t-sm" style={{ height: '40%' }}></div>
              <div className="flex-1 bg-outline-variant/20 rounded-t-sm" style={{ height: '55%' }}></div>
              <div className="flex-1 bg-outline-variant/20 rounded-t-sm" style={{ height: '45%' }}></div>
              <div className="flex-1 bg-secondary/40 rounded-t-sm" style={{ height: '70%' }}></div>
              <div className="flex-1 bg-secondary/60 rounded-t-sm" style={{ height: '85%' }}></div>
              <div className="flex-1 bg-primary-container rounded-t-sm" style={{ height: '95%' }}></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-[80px]"></div>
        </div>
      </div>
    </section>
  );
};
