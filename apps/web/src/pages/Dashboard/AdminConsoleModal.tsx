import React, { useState, useEffect } from 'react';

interface AdminConsoleModalProps {
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  promptInput: string;
  setPromptInput: (val: string) => void;
  isGenerating: boolean;
  errorMsg: string | null;
  onGenerateMarket: () => void;
  isSyncing: boolean;
  onSyncPolymarket: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  showAdminModal,
  setShowAdminModal,
  promptInput,
  setPromptInput,
  isGenerating,
  errorMsg: externalErrorMsg,
  onGenerateMarket,
  isSyncing,
  onSyncPolymarket
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'sync' | 'manual' | 'resolve'>('ai');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Manual Creator Form State
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualCategory, setManualCategory] = useState("SPORTS");
  const [manualDescription, setManualDescription] = useState("");
  const [manualRules, setManualRules] = useState("");
  const [manualResolution, setManualResolution] = useState("");
  const [manualYesPrice, setManualYesPrice] = useState(50);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Resolve Markets State
  const [openMarkets, setOpenMarkets] = useState<any[]>([]);
  const [isLoadingOpenMarkets, setIsLoadingOpenMarkets] = useState(false);
  const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);
  const [resolveSuccessMsg, setResolveSuccessMsg] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load open markets when the "resolve" tab becomes active
  const fetchOpenMarkets = async () => {
    setIsLoadingOpenMarkets(true);
    setLocalError(null);
    try {
      const response = await fetch(`${API_URL}/api/markets?limit=100`);
      if (response.ok) {
        const data = await response.json();
        // Filter only open/active markets
        const active = data.filter((m: any) => m.status === 'Active' || m.status === 'OPEN');
        setOpenMarkets(active);
      } else {
        setLocalError("Failed to fetch open markets for resolution.");
      }
    } catch (err) {
      console.error(err);
      setLocalError("Connection error while loading markets.");
    } finally {
      setIsLoadingOpenMarkets(false);
    }
  };

  useEffect(() => {
    if (showAdminModal && activeTab === 'resolve') {
      fetchOpenMarkets();
    }
  }, [showAdminModal, activeTab]);

  if (!showAdminModal) return null;

  const handleCreateManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim()) {
      setLocalError("Please enter a question.");
      return;
    }
    
    setIsCreatingManual(true);
    setLocalError(null);
    setManualSuccessMsg(null);
    
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(`${API_URL}/api/markets/create-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: manualQuestion,
          category: manualCategory,
          description: manualDescription,
          rules: manualRules || undefined,
          resolutionCriteria: manualResolution || undefined,
          yesPrice: manualYesPrice
        })
      });

      if (response.ok) {
        setManualSuccessMsg("Successfully deployed custom prediction market and seeded orderbook liquidity!");
        // Reset form
        setManualQuestion("");
        setManualDescription("");
        setManualRules("");
        setManualResolution("");
        setManualYesPrice(50);
        
        // Dispatch event to reload dashboard list
        window.dispatchEvent(new Event('auth-change'));
      } else {
        const errData = await response.json();
        setLocalError(errData.error || "Failed to create manual market.");
      }
    } catch (err) {
      console.error(err);
      setLocalError("Connection error. Could not reach server.");
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleResolveMarket = async (marketId: string, outcome: 'YES' | 'NO') => {
    if (resolvingMarketId) return;
    
    setResolvingMarketId(marketId);
    setLocalError(null);
    setResolveSuccessMsg(null);
    
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(`${API_URL}/api/markets/resolve-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ marketId, outcome })
      });

      if (response.ok) {
        setResolveSuccessMsg(`Successfully resolved market to ${outcome}! All payouts have been settled.`);
        await fetchOpenMarkets();
        // Dispatch event to update user balance
        window.dispatchEvent(new Event('auth-change'));
      } else {
        const errData = await response.json();
        setLocalError(errData.error || "Failed to resolve market.");
      }
    } catch (err) {
      console.error(err);
      setLocalError("Connection error while resolving market.");
    } finally {
      setResolvingMarketId(null);
    }
  };

  const currentError = localError || externalErrorMsg;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-[#121315] border border-primary/20 rounded-xl p-8 max-w-2xl w-full mx-4 shadow-[0_0_50px_rgba(0,242,255,0.2)] relative animate-fade-in flex flex-col max-h-[85vh]">
        <button 
          className="absolute top-4 right-4 text-outline hover:text-primary transition-colors cursor-pointer" 
          onClick={() => { setShowAdminModal(false); setPromptInput(""); setLocalError(null); setManualSuccessMsg(null); setResolveSuccessMsg(null); }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-headline-md text-display-xs text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
          <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span> Admin Control Panel
        </h2>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant/15 mb-6 gap-2">
          <button 
            onClick={() => { setActiveTab('ai'); setLocalError(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-label-caps border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span> AI Gen
          </button>
          <button 
            onClick={() => { setActiveTab('sync'); setLocalError(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-label-caps border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'sync' ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-sm">cloud_sync</span> Polymarket Sync
          </button>
          <button 
            onClick={() => { setActiveTab('manual'); setLocalError(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-label-caps border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'manual' ? 'border-[#ff00ea] text-[#ff00ea]' : 'border-transparent text-outline hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span> Manual Creator
          </button>
          <button 
            onClick={() => { setActiveTab('resolve'); setLocalError(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-label-caps border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'resolve' ? 'border-amber-500 text-amber-500' : 'border-transparent text-outline hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-sm">gavel</span> Resolve Markets
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto pr-1">
          {/* Tab 1: AI Generator */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-headline-sm text-primary flex items-center gap-2">
                Deploy GenAI Prediction Market
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                Enter an idea or concept, and the GenAI Market Creator agent will automatically generate a title, rules, description, resolution criteria, and seed the orderbook liquidity.
              </p>
              <textarea 
                className="w-full h-24 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                placeholder="e.g., Will India win the next cricket series? or Will Bitcoin touch $120k?"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
              />
              <button 
                className="w-full bg-primary hover:brightness-110 text-on-primary py-2.5 rounded-lg font-bold font-label-caps tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                disabled={isGenerating || !promptInput.trim()}
                onClick={onGenerateMarket}
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                    Deploying Market...
                  </>
                ) : (
                  'Generate & Deploy'
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Polymarket Sync */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-headline-sm text-secondary flex items-center gap-2">
                Sync Polymarket Live Stream
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                Directly fetch and import active real-world prediction questions from Polymarket's Gamma discovery service, and seed the initial orderbook liquidity automatically.
              </p>
              <button 
                className="w-full bg-secondary/15 hover:bg-secondary/20 text-secondary border border-secondary/30 py-2.5 rounded-lg font-bold font-label-caps tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                disabled={isSyncing}
                onClick={onSyncPolymarket}
              >
                {isSyncing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                    Syncing Polymarket...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Sync 15 Live Polymarket Questions
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 3: Manual Creator */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateManualSubmit} className="space-y-4">
              <h3 className="font-headline-md text-headline-sm text-[#ff00ea] flex items-center gap-2">
                Create Custom YES/NO Market
              </h3>
              
              {manualSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs text-center">
                  {manualSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">Market Question *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Will France win the 2026 FIFA World Cup?"
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">Category</label>
                  <select 
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                  >
                    <option value="SPORTS">Sports</option>
                    <option value="POLITICS">Politics</option>
                    <option value="ECONOMICS">Economics</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="SCIENCE">Science</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">
                    Initial YES Price: <span className="text-[#ff00ea] font-bold font-data-mono">{manualYesPrice}¢</span> (NO: {100 - manualYesPrice}¢)
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="95" 
                    className="w-full accent-[#ff00ea] bg-surface-container-high h-2 rounded-lg cursor-pointer mt-3"
                    value={manualYesPrice}
                    onChange={(e) => setManualYesPrice(Number(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">Description</label>
                  <textarea 
                    className="w-full h-16 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all resize-none"
                    placeholder="Enter market details and background information..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">Resolution Rules</label>
                  <textarea 
                    className="w-full h-14 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all resize-none"
                    placeholder="Rules context (resolves to YES if...)"
                    value={manualRules}
                    onChange={(e) => setManualRules(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-outline font-label-caps mb-1.5 block">Resolution Criteria</label>
                  <textarea 
                    className="w-full h-14 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all resize-none"
                    placeholder="Resolution source link or authority..."
                    value={manualResolution}
                    onChange={(e) => setManualResolution(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#ff00ea] hover:brightness-110 text-on-primary py-2.5 rounded-lg font-bold font-label-caps tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                disabled={isCreatingManual}
              >
                {isCreatingManual ? (
                  <>
                    <div className="h-4 w-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                    Deploying custom market...
                  </>
                ) : (
                  'Deploy Custom Market'
                )}
              </button>
            </form>
          )}

          {/* Tab 4: Resolve Markets */}
          {activeTab === 'resolve' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-headline-sm text-amber-500 flex items-center gap-2">
                Settle & Resolve Markets
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                Manually resolve active markets to YES or NO. Resolving a market settles all outstanding positions, pays winners $1.00 (100¢) per share, refunds bids, and closes orderbooks.
              </p>

              {resolveSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs text-center">
                  {resolveSuccessMsg}
                </div>
              )}

              {isLoadingOpenMarkets ? (
                <div className="py-12 flex justify-center items-center gap-2">
                  <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-outline">Loading active markets...</span>
                </div>
              ) : openMarkets.length === 0 ? (
                <div className="py-12 text-center text-xs text-outline-variant">
                  No active prediction markets available to resolve.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/10 max-h-[350px] overflow-y-auto border border-outline-variant/20 rounded-lg bg-surface-container-low/50">
                  {openMarkets.map((market: any) => (
                    <div key={market.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-outline-variant bg-surface-container px-2 py-0.5 rounded uppercase font-label-caps block w-max mb-1.5">{market.category}</span>
                        <h4 className="text-sm font-semibold text-on-surface truncate pr-4" title={market.title}>{market.title}</h4>
                        <span className="text-[10px] text-outline mt-1 block">YES: {market.yesPrice}¢ | NO: {market.noPrice}¢</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to resolve "${market.title}" to YES? This action is final.`)) {
                              handleResolveMarket(market.id, 'YES');
                            }
                          }}
                          disabled={!!resolvingMarketId}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold font-label-caps px-3 py-1.5 rounded active:scale-95 transition-all disabled:opacity-50 cursor-pointer animate-pulse"
                        >
                          {resolvingMarketId === market.id ? 'Settling...' : 'YES'}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to resolve "${market.title}" to NO? This action is final.`)) {
                              handleResolveMarket(market.id, 'NO');
                            }
                          }}
                          disabled={!!resolvingMarketId}
                          className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold font-label-caps px-3 py-1.5 rounded active:scale-95 transition-all disabled:opacity-50 cursor-pointer animate-pulse"
                        >
                          {resolvingMarketId === market.id ? 'Settling...' : 'NO'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {currentError && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs text-center mt-6">
            {currentError}
          </div>
        )}
      </div>
    </div>
  );
};
