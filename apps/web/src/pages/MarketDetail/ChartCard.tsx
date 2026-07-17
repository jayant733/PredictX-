import React from 'react';
import { getChartPath } from './marketDetailHelpers';

interface ChartCardProps {
  market: any;
  mockMarket: any;
  chartData: any[];
}

export const ChartCard: React.FC<ChartCardProps> = ({ market, mockMarket, chartData }) => {
  const currentProb = market ? market.yesPrice : mockMarket.currentProbability;
  const isUp = market ? (market.yesPrice >= 50) : true;
  const changeProb = market ? Math.abs(market.yesPrice - 50).toFixed(1) : mockMarket.probabilityChange;
  const { linePath, fillPath } = getChartPath(chartData);

  return (
    <div className="glass-panel rounded-xl p-6 market-detail-metallic-border animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-on-surface-variant text-xs uppercase tracking-tighter">Current Probability</span>
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md text-secondary">{currentProb}%</span>
            <span className="text-secondary text-sm flex items-center">
              <span className="material-symbols-outlined text-sm">
                {isUp ? 'arrow_upward' : 'arrow_downward'}
              </span> 
              {changeProb}%
            </span>
          </div>
        </div>
        <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
          <button className="px-3 py-1 text-xs font-bold rounded bg-surface-variant text-primary">5D</button>
          <button className="px-3 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface">14D</button>
          <button className="px-3 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface">1M</button>
          <button className="px-3 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface">1Y</button>
        </div>
      </div>

      <div className="h-64 w-full relative overflow-hidden flex items-end">
        <div className="absolute inset-0 flex items-end">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(0, 242, 255, 0.2)"></stop>
                <stop offset="100%" stopColor="rgba(0, 242, 255, 0)"></stop>
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#chartGradient)"></path>
            <path className="market-detail-neon-glow-cyan" d={linePath} fill="none" stroke="#00f2ff" strokeWidth="2"></path>
          </svg>
        </div>
        <div className="w-full flex justify-between absolute bottom-0 pt-2 border-t border-outline-variant/10 text-[10px] text-on-surface-variant font-data-mono">
          <span>MAY 12</span>
          <span>MAY 13</span>
          <span>MAY 14</span>
          <span>MAY 15</span>
          <span>TODAY</span>
        </div>
      </div>
    </div>
  );
};
