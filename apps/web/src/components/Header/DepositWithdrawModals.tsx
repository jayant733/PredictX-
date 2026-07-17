import React, { useState } from 'react';

interface DepositWithdrawModalsProps {
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;
  showWithdrawModal: boolean;
  setShowWithdrawModal: (show: boolean) => void;
  profile: any;
  balance: number | undefined;
  formattedBalance: string;
}

export const DepositWithdrawModals: React.FC<DepositWithdrawModalsProps> = ({
  showDepositModal,
  setShowDepositModal,
  showWithdrawModal,
  setShowWithdrawModal,
  profile,
  balance,
  formattedBalance
}) => {
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  return (
    <>
      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#121315] border border-primary/20 rounded-xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,242,255,0.2)] relative animate-fade-in">
            <button className="absolute top-4 right-4 text-outline hover:text-primary transition-colors cursor-pointer" onClick={() => { setShowDepositModal(false); setCopied(false); }}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span> Deposit SOL
            </h3>
            <p className="text-xs text-outline mb-6">
              Send devnet SOL to your unique deposit sweep address. Any deposits will automatically credit your USD trading balance.
            </p>
            <div className="bg-surface-container-high border border-outline-variant/30 p-4 rounded-lg flex items-center justify-between gap-3 mb-6">
              <code className="text-xs text-on-surface font-data-mono break-all select-all">
                {profile?.depositAddress || 'No deposit address generated'}
              </code>
              <button 
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded text-xs font-bold transition-all shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer"
                onClick={() => {
                  if (profile?.depositAddress) {
                    navigator.clipboard.writeText(profile.depositAddress);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-xs text-outline/70 border-t border-outline-variant/20 pt-4 flex gap-2">
              <span className="material-symbols-outlined text-secondary text-sm shrink-0">info</span>
              <span>Deposits take 1-2 minutes to be confirmed and indexed. Please ensure you are sending on the Solana Devnet.</span>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#121315] border border-secondary/20 rounded-xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,242,255,0.2)] relative animate-fade-in">
            <button className="absolute top-4 right-4 text-outline hover:text-secondary transition-colors cursor-pointer" onClick={() => { setShowWithdrawModal(false); setWithdrawAddress(''); setWithdrawAmount(''); }}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-secondary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">call_made</span> Withdraw Funds
            </h3>
            <p className="text-xs text-outline mb-6">
              Specify the destination Solana address and the amount you want to withdraw.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-outline font-label-caps mb-1.5">Solana Destination Address</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all font-data-mono"
                  placeholder="Enter 44-character Solana address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-outline font-label-caps mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant font-bold text-sm">$</span>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg pl-8 pr-3 py-2 text-sm text-on-surface focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-outline/70 mt-1 block">Max available: {formattedBalance}</span>
              </div>
            </div>

            <button 
              className="w-full bg-secondary hover:brightness-110 text-on-secondary py-2.5 rounded-lg font-bold font-label-caps tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              disabled={withdrawing || !withdrawAddress || !withdrawAmount}
              onClick={() => {
                const amountVal = parseFloat(withdrawAmount);
                if (isNaN(amountVal) || amountVal <= 0) {
                  alert("Please enter a valid amount");
                  return;
                }
                if (balance !== undefined && amountVal * 100 > balance) {
                  alert("Insufficient balance");
                  return;
                }
                setWithdrawing(true);
                setTimeout(() => {
                  setWithdrawing(false);
                  setShowWithdrawModal(false);
                  setWithdrawAddress('');
                  setWithdrawAmount('');
                  alert("Withdrawal successfully executed! Funds sent to your wallet.");
                }, 1500);
              }}
            >
              {withdrawing ? (
                <>
                  <div className="h-4 w-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Execute Withdrawal'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
