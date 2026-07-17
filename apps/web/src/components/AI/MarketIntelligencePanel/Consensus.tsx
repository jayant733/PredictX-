import React from 'react';

interface ConsensusProps {
  summary: {
    bullet1: string;
    bullet2: string;
    bullet3: string;
  };
}

export const Consensus: React.FC<ConsensusProps> = ({ summary }) => {
  const extractMetric = (bulletText: string) => {
    const pctMatch = bulletText.match(/(\d+%)/);
    if (pctMatch) return `+${pctMatch[1]}`;
    const moneyMatch = bulletText.match(/(\$\d+\w+)/);
    if (moneyMatch) return moneyMatch[1];
    return "LTP";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { title: 'News Catalyst', bullet: summary.bullet1, color: 'text-cyan-400' },
        { title: 'Twitter sentiment', bullet: summary.bullet2, color: 'text-sky-400' },
        { title: 'Orderbook change', bullet: summary.bullet3, color: 'text-[#ff0055]' }
      ].map((card, idx) => (
        <div key={idx} className="bg-surface-container-low/40 border border-outline-variant/15 rounded-xl p-4 flex flex-col justify-between h-32 relative group overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-7xl select-none">analytics</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider font-data-mono">{card.title}</span>
            <span className="material-symbols-outlined text-xs text-on-surface-variant/40">north_east</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold ${card.color} tracking-tight font-data-mono`}>
              {extractMetric(card.bullet)}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center font-data-mono">
              ▲ SURGE
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium leading-normal line-clamp-2">
            {card.bullet}
          </p>
        </div>
      ))}
    </div>
  );
};
