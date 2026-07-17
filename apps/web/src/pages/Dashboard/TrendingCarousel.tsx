import React from 'react';

interface TrendingCarouselProps {
  btcMarketFromDb: any;
  uclMarketFromDb: any;
  recessionMarketFromDb: any;
  onNavigateMarket: (path: string) => void;
}

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({
  btcMarketFromDb,
  uclMarketFromDb,
  recessionMarketFromDb,
  onNavigateMarket
}) => {
  return (
    <section className="mb-10 relative animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Trending Markets</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Banner 1 */}
        <div className="group relative h-64 rounded-xl overflow-hidden glass-panel border border-primary/20 hover:border-primary/50 transition-all cursor-pointer" onClick={() => onNavigateMarket(btcMarketFromDb ? `/market/${btcMarketFromDb.id}` : '/market/btc-100k')}>
          <img className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="btc" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkX2SIexu5mrlbIk9ttpAgfk6q_BZ0L1-bRR9P6QgRMVqPAvnb5ejBrZT0g69kyCJC1MjgUsxbgx6oPED4oQupgJjZN6REIJ0FuNl-bItXXVF9Lsqo3A1nZ58iEmj8iHyG2M6ijnXEaUjrRAXj4xVh8xAdaom7pmDORA4fFmfBUHMPaitGcjaCn2oKY1byf1Ac3S8TMCBf7wB6akvwAkbkhjmbMaAxiZ1sSQ_mu27FJt37LvuYmklUZqwbxKNe7JYGn50cF2GMIlDY" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent p-6 flex flex-col justify-end">
            <div className="flex gap-2 mb-2">
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-label-caps">CRYPTO</span>
              <span className="bg-secondary/20 text-secondary text-[10px] px-2 py-0.5 rounded font-label-caps">HIGH VOLATILITY</span>
            </div>
            <h3 className="font-market-question text-market-question mb-4 text-[#e3e2e5]">Will BTC hit $100k by the end of 2024?</h3>
            <div className="flex justify-between items-center">
              <span className="font-data-mono text-sm text-[#849495]">$15.6M Vol</span>
              <span className="text-primary font-bold">Yes 75¢</span>
            </div>
          </div>
        </div>
        {/* Banner 2 */}
        <div className="group relative h-64 rounded-xl overflow-hidden glass-panel border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer" onClick={() => onNavigateMarket(uclMarketFromDb ? `/market/${uclMarketFromDb.id}` : '/market/ucl-2024')}>
          <img className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="ucl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3KDjsl07lPnsQ_LrQMvtU-2F9Y3v8GxrYJ8b8DcW1KZXB1SERU4KnaGHMC-sa7f4KoeVXaLI3yh4AUfesoWiv5DBl15Dpsi7hOj8Q2syv_yFQPF9LLTXKwRmtyTkHJv_EzFN1hxlY9AlehOqj0zv4chrW-0iRcKZduLPfeiACJOwUzwcgSiLf0uGxYOStSqWr93CtdEAzp5vkmgxxl4yEnwnFTG3-0iTO0U8t9Vo7wQk7aGBf1Jg5FWmMRWDuLO7Tj6pbz4t-f9yH" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent p-6 flex flex-col justify-end">
            <div className="flex gap-2 mb-2">
              <span className="bg-secondary-container/20 text-secondary text-[10px] px-2 py-0.5 rounded font-label-caps">SPORTS</span>
            </div>
            <h3 className="font-market-question text-market-question mb-4 text-[#e3e2e5]">Will Real Madrid win the UEFA Champions League 2024?</h3>
            <div className="flex justify-between items-center">
              <span className="font-data-mono text-sm text-[#849495]">$850K Vol</span>
              <span className="text-primary font-bold">Yes 60¢</span>
            </div>
          </div>
        </div>
        {/* Banner 3 */}
        <div className="group relative h-64 rounded-xl overflow-hidden glass-panel border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer" onClick={() => onNavigateMarket(recessionMarketFromDb ? `/market/${recessionMarketFromDb.id}` : '/market/recession-2024')}>
          <img className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="election" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIW5cIaB9iNoD95Ht292odPH_OsKGWRJo35Lkmnq23MATVszZYQ-dcSO09QnAHbzML_RbUFQ7dKX1sHmrFveSXMhq2ra9rOJv_dd3lmhIXhGRBDb8bardKP9bwjaiad-0vQ7dHFNkmEf7sZUor8zutSp0WVCPpuxVyF-kobjqeLC5jiPBy_y4m7ikd6Qvi5XAWFScLC1OnV_kScPozShOE2q0AhCRgJpuIm8fS9RDPXVNyTqI9D3hk4nSzP-Qjs3ihN7hBwt650hoL" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent p-6 flex flex-col justify-end">
            <div className="flex gap-2 mb-2">
              <span className="bg-tertiary-container/20 text-on-tertiary-container text-[10px] px-2 py-0.5 rounded font-label-caps">POLITICS</span>
            </div>
            <h3 className="font-market-question text-market-question mb-4 text-[#e3e2e5]">Will the US enter a recession in 2024?</h3>
            <div className="flex justify-between items-center">
              <span className="font-data-mono text-sm text-[#849495]">$4.2M Vol</span>
              <span className="text-primary font-bold">Yes 34¢</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
