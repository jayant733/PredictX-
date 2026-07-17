import React from 'react';

interface TradeSummaryProps {
  price: number;
  totalCost: string;
  maxPayout: string;
  maxProfit: string;
  profitPercentage: string | number;
}

export const TradeSummary: React.FC<TradeSummaryProps> = ({
  price,
  totalCost,
  maxPayout,
  maxProfit,
  profitPercentage
}) => {
  return (
    <div className="bg-surface-container-low rounded-lg p-4 space-y-3 border border-outline-variant/10">
      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">Avg Price</span>
        <span className="text-on-surface">${price.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">Total Cost</span>
        <span className="text-on-surface">${totalCost}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">Max Payout</span>
        <span className="text-secondary">${maxPayout}</span>
      </div>
      <div className="pt-2 border-t border-outline-variant/10 flex justify-between text-sm font-bold">
        <span className="text-on-surface">Max Profit</span>
        <span className="text-secondary">${maxProfit} ({profitPercentage}%)</span>
      </div>
    </div>
  );
};
