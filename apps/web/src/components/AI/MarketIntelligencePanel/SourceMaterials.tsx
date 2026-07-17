import React from 'react';

interface SourceMaterialsProps {
  selectedTab: 'news' | 'twitter' | 'crypto' | 'market';
  newsData?: string;
  twitterData?: string;
  cryptoData?: string;
  marketData?: string;
}

export const SourceMaterials: React.FC<SourceMaterialsProps> = ({
  selectedTab,
  newsData,
  twitterData,
  cryptoData,
  marketData
}) => {
  const getTabDetails = () => {
    switch (selectedTab) {
      case 'news':
        return {
          title: 'Raw Tavily / pgvector Retrieval Logs',
          color: 'text-cyan-400',
          data: newsData
        };
      case 'twitter':
        return {
          title: 'Social Sentiment Scraper output',
          color: 'text-sky-400',
          data: twitterData
        };
      case 'crypto':
        return {
          title: 'Token Metrics & Exchange Reserves logs',
          color: 'text-yellow-400',
          data: cryptoData
        };
      case 'market':
        return {
          title: 'Orderbook Volume & Margin skew analysis',
          color: 'text-[#ff0055]',
          data: marketData
        };
      default:
        return null;
    }
  };

  const details = getTabDetails();
  if (!details) return null;

  return (
    <div className="space-y-3 font-data-mono">
      <span className={`text-[10px] ${details.color} font-bold uppercase tracking-wider flex items-center gap-1`}>
        <span className="material-symbols-outlined text-xs">source</span>
        {details.title}
      </span>
      <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-[#050608] p-4 rounded-lg border border-outline-variant/10">
        {details.data || "No source logs indexed."}
      </p>
    </div>
  );
};
