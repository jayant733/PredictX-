import React from 'react';

interface AboutMarketAccordionsProps {
  openAccordion: string | null;
  toggleAccordion: (id: string) => void;
  mockMarket: any;
}

export const AboutMarketAccordions: React.FC<AboutMarketAccordionsProps> = ({
  openAccordion,
  toggleAccordion,
  mockMarket
}) => {
  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-lg overflow-hidden border border-outline-variant/10">
        <button className="w-full px-6 py-4 flex justify-between items-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" onClick={() => toggleAccordion('about')}>
          <span className="font-bold text-on-surface">About the Market</span>
          <span className={`material-symbols-outlined transition-transform ${openAccordion === 'about' ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {openAccordion === 'about' && (
          <div className="p-6 text-body-md text-on-surface-variant leading-relaxed">
            {mockMarket.about}
          </div>
        )}
      </div>
      <div className="glass-panel rounded-lg overflow-hidden border border-outline-variant/10">
        <button className="w-full px-6 py-4 flex justify-between items-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer" onClick={() => toggleAccordion('rules')}>
          <span className="font-bold text-on-surface">Resolution Rules</span>
          <span className={`material-symbols-outlined transition-transform ${openAccordion === 'rules' ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {openAccordion === 'rules' && (
          <div className="p-6 text-body-md text-on-surface-variant leading-relaxed">
            <ul className="list-disc list-inside space-y-2">
              {mockMarket.rules.map((rule: string, idx: number) => <li key={idx}>{rule}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
