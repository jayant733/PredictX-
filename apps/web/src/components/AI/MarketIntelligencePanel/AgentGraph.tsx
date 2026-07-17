import React from 'react';

interface AgentNode {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface AgentGraphProps {
  agentMeta: AgentNode[];
  fullState: any;
  activeNode: number;
  selectedTab: string;
  setSelectedTab: (key: any) => void;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({
  agentMeta,
  fullState,
  activeNode,
  selectedTab,
  setSelectedTab
}) => {
  return (
    <div className="bg-surface-container-low/20 rounded-xl p-4 border border-outline-variant/10">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">State Graph Visualizer</span>
        {!fullState && activeNode >= 0 && (
          <span className="text-[10px] text-[#00f2ff] font-data-mono animate-pulse">Routing Nodes...</span>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 relative">
        {agentMeta.map((node, index) => {
          const isCompleted = fullState || index < activeNode;
          const isActive = index === activeNode;
          const isSelected = selectedTab === node.key;

          return (
            <React.Fragment key={node.key}>
              <div 
                onClick={() => fullState && setSelectedTab(node.key)}
                className={`flex flex-col items-center z-10 cursor-pointer group transition-all duration-300 ${
                  fullState ? 'hover:scale-105' : 'pointer-events-none'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-primary-container border-primary text-on-primary-container shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                    : isCompleted 
                    ? 'bg-surface-container border-primary/50 text-primary' 
                    : isActive 
                    ? 'bg-[#00f2ff]/10 border-[#00f2ff] text-[#00f2ff] animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant/40'
                }`}>
                  <span className="material-symbols-outlined text-sm">{node.icon}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase font-data-mono mt-1.5 transition-colors ${
                  isSelected 
                    ? 'text-primary' 
                    : isCompleted 
                    ? 'text-on-surface-variant' 
                    : isActive 
                    ? 'text-[#00f2ff]' 
                    : 'text-on-surface-variant/30'
                }`}>
                  {node.label}
                </span>
              </div>

              {index < 4 && (
                <div className="hidden md:block flex-1 h-[2px] mx-2 relative bg-surface-container-high/40">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#00f2ff] transition-all duration-500 shadow-[0_0_8px_rgba(0,242,255,0.5)]" 
                    style={{ 
                      width: fullState ? "100%" : index < activeNode ? "100%" : isActive ? "50%" : "0%" 
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
