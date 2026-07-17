import React from 'react';

interface RichReportRendererProps {
  report: string;
}

export const RichReportRenderer: React.FC<RichReportRendererProps> = ({ report }) => {
  const blocks = report.split('\n\n');

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Check for Headers
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className="text-xs font-extrabold text-primary tracking-wider uppercase flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
              {text}
            </h4>
          );
        }

        // 2. Check for Bullet Catalysts or lists
        const lines = trimmed.split('\n');
        const isListBlock = lines.some(line => /^\d+\.\s+\*\*/.test(line.trim()));
        
        if (isListBlock) {
          return (
            <div key={idx} className="grid grid-cols-1 gap-3 my-2">
              {lines.map((line, lineIdx) => {
                const listMatch = line.trim().match(/^(\d+)\.\s+\*\*(.*?)\*\*:(.*)/);
                if (listMatch) {
                  const [, num, title, detail] = listMatch;
                  
                  const formattedDetail = detail
                    .replace(/(\d+%\s*inflows|\d+%\s*sentiment|\d+%\s*volume|\d+%\s*shift|\d+%\s*increase|\d+%\s*dip|\d+%\s*growth|\d+%\s*drop)/gi, '<strong class="text-primary font-bold font-data-mono bg-primary/10 px-1 py-0.5 rounded">$1</strong>')
                    .replace(/(\d+%\s*ETF|\d+%\s*social|\d+%\s*prediction|\d+%|\$\d+\w*|62¢|71¢)/gi, '<strong class="text-primary font-bold font-data-mono bg-primary/10 px-1 py-0.5 rounded">$1</strong>');

                  let icon = "verified";
                  let iconColor = "text-cyan-400";
                  let borderGlow = "border-cyan-500/20";
                  let hoverGlow = "hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/40";
                  
                  if (num === "1" || title.toLowerCase().includes("chain") || title.toLowerCase().includes("financial") || title.toLowerCase().includes("news")) {
                    icon = "payments";
                    iconColor = "text-cyan-400";
                    borderGlow = "border-cyan-500/20";
                    hoverGlow = "hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/40";
                  } else if (num === "2" || title.toLowerCase().includes("social") || title.toLowerCase().includes("twitter") || title.toLowerCase().includes("sentiment")) {
                    icon = "chat";
                    iconColor = "text-sky-400";
                    borderGlow = "border-sky-500/20";
                    hoverGlow = "hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:border-sky-400/40";
                  } else if (num === "3" || title.toLowerCase().includes("market") || title.toLowerCase().includes("prediction") || title.toLowerCase().includes("clob") || title.toLowerCase().includes("volume")) {
                    icon = "trending_up";
                    iconColor = "text-[#ff0055]";
                    borderGlow = "border-[#ff0055]/20";
                    hoverGlow = "hover:shadow-[0_0_15px_rgba(255,0,85,0.15)] hover:border-[#ff0055]/40";
                  }

                  return (
                    <div 
                      key={lineIdx} 
                      className={`p-4 rounded-xl border ${borderGlow} bg-surface-container-high/10 backdrop-blur-md flex gap-4 items-start transition-all duration-300 ${hoverGlow}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-surface-container/40 flex items-center justify-center border border-outline-variant/15 ${iconColor} shrink-0`}>
                        <span className="material-symbols-outlined text-base">{icon}</span>
                      </div>
                      <div className="flex-1 text-xs leading-relaxed text-on-surface-variant">
                        <span className="font-extrabold text-on-surface uppercase tracking-wide mr-1.5">{title}</span>
                        <span dangerouslySetInnerHTML={{ __html: formattedDetail }} />
                      </div>
                    </div>
                  );
                }
                return <p key={lineIdx} className="text-xs text-on-surface-variant leading-relaxed">{line}</p>;
              })}
            </div>
          );
        }

        // 3. Check for Disclaimers
        if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.toLowerCase().includes('disclaimer')) {
          const text = trimmed.replace(/\*/g, '');
          return (
            <div key={idx} className="p-3 bg-surface-container-high/5 rounded-lg border border-outline-variant/5 text-[10px] text-on-surface-variant/40 leading-relaxed font-data-mono flex gap-2 items-center">
              <span className="material-symbols-outlined text-xs">gavel</span>
              <span>{text}</span>
            </div>
          );
        }

        // 4. Regular paragraph
        const formattedParagraph = trimmed
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-on-surface">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>');

        return (
          <p 
            key={idx} 
            className="text-xs text-on-surface-variant leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: formattedParagraph }}
          />
        );
      })}
    </div>
  );
};
