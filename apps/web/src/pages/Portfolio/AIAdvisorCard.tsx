import React from 'react';
import { CategoryAllocations } from './CategoryAllocations';

interface AIAdvisorCardProps {
  auditResult: any | null;
  loadingAudit: boolean;
  onRequestAudit: () => void;
}

export const AIAdvisorCard: React.FC<AIAdvisorCardProps> = ({
  auditResult,
  loadingAudit,
  onRequestAudit
}) => {
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-on-surface font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <section className="portfolio-glass-card rounded-xl p-8 mb-8 relative overflow-hidden transition-all duration-750">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl portfolio-neon-glow">psychology</span>
          <div>
            <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
              AI Portfolio Advisor
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">AGENT</span>
            </h2>
            <p className="text-xs text-on-surface-variant">Get automated risk assessment, sector exposure analysis, and diversification advice.</p>
          </div>
        </div>
        {!auditResult && !loadingAudit && (
          <button onClick={onRequestAudit} className="bg-primary hover:bg-primary/80 text-on-primary font-bold px-6 py-2 rounded-lg text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap cursor-pointer">
            <span className="material-symbols-outlined text-sm">analytics</span>Run AI Portfolio Audit
          </button>
        )}
        {auditResult && !loadingAudit && (
          <button onClick={onRequestAudit} className="bg-surface-container-highest hover:bg-surface-variant text-on-surface border border-outline-variant/30 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap cursor-pointer">
            <span className="material-symbols-outlined text-sm">refresh</span>Recalculate
          </button>
        )}
      </div>

      {loadingAudit && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-on-surface-variant font-data-mono animate-pulse">PREDICTX RISK AGENT RUNNING DEEP AUDIT...</span>
        </div>
      )}

      {!loadingAudit && !auditResult && (
        <div className="bg-surface-container-low/50 border border-outline-variant/10 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-on-surface mb-1">Deep Portfolio Inspection</h3>
            <p className="text-xs text-on-surface-variant">Analyze your open contract positions, category concentration levels, total PnL performance, and receive diversification strategy recommendations.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center p-3 px-4 bg-surface-container-highest/40 rounded-lg border border-outline-variant/10">
              <span className="material-symbols-outlined text-secondary text-lg">shield</span>
              <span className="text-[10px] text-on-surface-variant mt-1 font-label-caps">RISK CHECK</span>
            </div>
            <div className="flex flex-col items-center p-3 px-4 bg-surface-container-highest/40 rounded-lg border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
              <span className="text-[10px] text-on-surface-variant mt-1 font-label-caps">ALLOCATION</span>
            </div>
          </div>
        </div>
      )}

      {!loadingAudit && auditResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-outline-variant/10">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
              <span className="text-xs text-on-surface-variant font-label-caps">PORTFOLIO RISK PROFILE</span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                auditResult.riskLevel === 'HIGH' ? 'bg-error/10 text-error border-error/30 animate-pulse' : auditResult.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-secondary/10 text-secondary border-secondary/30'
              }`}>{auditResult.riskLevel} Risk</span>
            </div>
            <CategoryAllocations allocations={auditResult.allocations} />
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-lg p-6 h-full flex flex-col">
              <h3 className="text-xs text-on-surface-variant font-label-caps mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">notes</span>AGENT AUDIT REPORT</h3>
              <div className="text-sm leading-relaxed text-on-surface-variant space-y-4 flex-1 max-h-[300px] overflow-y-auto pr-2 portfolio-advisor-report font-body-md">
                {auditResult.report ? (
                  auditResult.report.split('\n').map((line: string, i: number) => {
                    const cleanLine = line.trim();
                    if (!cleanLine) return <div key={i} className="h-2" />;
                    if (cleanLine.startsWith('###')) return <h4 key={i} className="font-bold text-on-surface text-base mt-4 mb-2">{cleanLine.replace('###', '').replace(/\*\*/g, '').trim()}</h4>;
                    if (cleanLine.startsWith('####')) return <h5 key={i} className="font-bold text-on-surface text-sm mt-3 mb-1">{cleanLine.replace('####', '').replace(/\*\*/g, '').trim()}</h5>;
                    
                    if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
                      return <ul key={i} className="list-disc pl-5 my-1 space-y-1"><li className="text-xs">{parseBoldText(cleanLine.substring(1).trim())}</li></ul>;
                    }
                    if (/^\d+\./.test(cleanLine)) {
                      const match = cleanLine.match(/^(\d+)\.(.*)/);
                      if (match) return <ol key={i} className="list-decimal pl-5 my-1"><li className="text-xs">{parseBoldText(match[2].trim())}</li></ol>;
                    }
                    return <p key={i} className="text-xs">{parseBoldText(cleanLine)}</p>;
                  })
                ) : (
                  <p className="text-xs italic text-on-surface-variant/70">No report content available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
