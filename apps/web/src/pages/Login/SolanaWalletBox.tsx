import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface SolanaWalletBoxProps {
  isAuthenticating: boolean;
  isDemoAuthenticating: boolean;
  onDemoLogin: () => void;
}

export const SolanaWalletBox: React.FC<SolanaWalletBoxProps> = ({
  isAuthenticating,
  isDemoAuthenticating,
  onDemoLogin
}) => {
  if (isAuthenticating || isDemoAuthenticating) {
    return (
      <div className="flex items-center gap-3 bg-surface-container-high px-6 py-3 rounded-full border border-primary/50 text-primary font-bold tracking-wider">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        Authenticating...
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <WalletMultiButton className="!bg-primary !text-on-primary !px-8 !py-3 !font-label-caps !text-sm !rounded-lg !font-bold !uppercase !tracking-wider hover:!brightness-110 active:!scale-95 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] w-full flex justify-center" />
      
      <div className="flex items-center my-1 w-full text-center">
        <div className="flex-1 border-t border-outline-variant/30"></div>
        <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40">OR</span>
        <div className="flex-1 border-t border-outline-variant/30"></div>
      </div>

      <button 
        onClick={onDemoLogin}
        className="bg-transparent hover:bg-primary/5 text-primary border border-primary/40 hover:border-primary px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-lg active:scale-95 transition-all w-full flex justify-center items-center gap-2 shadow-[inset_0_0_10px_rgba(0,242,255,0.05)] cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">person_play</span>
        Bypass with Demo User (Admin)
      </button>
    </div>
  );
};
