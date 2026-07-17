import React from 'react';

interface PositionsTableProps {
  activePositions: any[];
  formatCurrency: (val: number) => string;
  onNavigate: (marketId: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({ 
  activePositions, 
  formatCurrency, 
  onNavigate 
}) => {
  return (
    <div className="portfolio-glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">MARKET</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">OUTCOME</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">SHARES</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">AVG. BUY</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">VALUE</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">UNREALIZED P&amp;L</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {activePositions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">No active positions found.</td></tr>
            ) : (
              activePositions.map(pos => (
                <tr key={pos.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">{pos.icon}</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">{pos.marketTitle}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">{pos.category} • {pos.endDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${pos.outcome === 'YES' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-error/10 text-error border-error/20'}`}>
                      {pos.outcome}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-data-mono text-sm">{pos.shares.toLocaleString()}</td>
                  <td className="px-6 py-5 font-data-mono text-sm text-on-surface-variant">${pos.avgBuy.toFixed(2)}</td>
                  <td className="px-6 py-5 font-data-mono text-sm text-right">{formatCurrency(pos.currentValue)}</td>
                  <td className="px-6 py-5 text-right">
                    <div className={`font-bold ${pos.isPositive ? 'text-secondary' : 'text-error'}`}>
                      {pos.isPositive ? '+' : '-'}{formatCurrency(Math.abs(pos.unrealizedPnL))}
                    </div>
                    <div className={`text-[10px] ${pos.isPositive ? 'text-secondary/60' : 'text-error/60'}`}>
                      {pos.isPositive ? '+' : ''}{pos.unrealizedPnLPercentage}%
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => onNavigate(pos.marketId)}
                      className="bg-surface-container-highest hover:bg-surface-variant text-on-surface px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
