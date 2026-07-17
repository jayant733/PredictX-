import React from 'react';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-24 bg-surface-container-low animate-fade-in">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-display-lg text-primary mb-4">Engineered for Excellence</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">PredictX combines the speed of modern DEX architecture with the depth of traditional finance order books.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Institutional Liquidity</h3>
            <p className="text-on-surface-variant font-body-md">Our high-depth orderbooks ensure tight spreads even for the largest positions. Market makers provide constant bid-ask flows.</p>
          </div>
          {/* Feature 2 */}
          <div className="p-8 rounded-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-3xl">bolt</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Web3-Native</h3>
            <p className="text-on-surface-variant font-body-md">Built on Solana for near-instant settlement. Your funds remain under your control until the market resolves, guaranteed by smart contracts.</p>
          </div>
          {/* Feature 3 */}
          <div className="p-8 rounded-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Trustless Resolution</h3>
            <p className="text-on-surface-variant font-body-md">Oracle-verified outcomes with decentralized clarity. We utilize multiple data feeds to eliminate ambiguity in market settlement.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
