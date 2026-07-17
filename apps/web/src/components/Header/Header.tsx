import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolioState } from '../../hooks/usePortfolioState';

// Lazy load modals for better load speed
const DepositWithdrawModals = lazy(() =>
  import('./DepositWithdrawModals').then(module => ({ default: module.DepositWithdrawModals }))
);

export const Header: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { isLoggedIn, claims, profile, signOut } = useAuth();
    const { totalEquity, availableCash, marketValue } = usePortfolioState();
    const navigate = useNavigate();

    // Deposit / Withdraw Modals triggers
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const walletAddress = claims?.wallet as string || '';
    const truncatedAddress = walletAddress ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}` : '';
    const walletInitials = walletAddress ? walletAddress.slice(0, 2).toUpperCase() : 'JD';
    const formattedEquity = `$${totalEquity.toFixed(2)}`;
    const formattedCash = `$${availableCash.toFixed(2)}`;
    const formattedOpenPositions = `$${marketValue.toFixed(2)}`;

    return (
        <>
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_4px_20px_rgba(0,242,255,0.1)] h-16 flex justify-between items-center px-margin-desktop">
                <div className="flex items-center gap-8">
                    <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter cursor-pointer" onClick={() => navigate('/')}>PREDICTX</span>
                    <div className="hidden md:flex gap-6">
                        <button onClick={() => navigate('/dashboard')} className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors duration-200">Markets</button>
                        <button onClick={() => navigate('/portfolio')} className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors duration-200">Portfolio</button>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {isLoggedIn && claims ? (
                        <>
                            {/* Wallet Card */}
                            <div className="hidden lg:flex items-center gap-4 bg-surface-container-high/50 metallic-border px-4 py-1.5 rounded-lg">
                                <div className="flex flex-col items-end text-xs font-data-mono leading-tight">
                                    <span className="text-[10px] text-outline-variant font-semibold select-all mb-1">{truncatedAddress}</span>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-outline text-[10px] uppercase font-label-caps">Account Equity</span>
                                        <span className="text-primary font-bold text-sm glow-cyan">{formattedEquity}</span>
                                    </div>
                                    <div className="text-[10px] text-outline flex gap-1 justify-end w-full">
                                        <span>Cash Available:</span>
                                        <span className="text-on-surface font-semibold">{formattedCash}</span>
                                    </div>
                                    <div className="text-[10px] text-outline flex gap-1 justify-end w-full">
                                        <span>Open Positions:</span>
                                        <span className="text-secondary font-semibold">{formattedOpenPositions}</span>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-outline-variant/30"></div>
                                <div className="flex gap-2">
                                    <button className="bg-primary px-3 py-1 text-on-primary font-label-caps text-[10px] rounded hover:brightness-110 active:scale-95 transition-all" onClick={() => setShowDepositModal(true)}>DEPOSIT</button>
                                    <button className="border border-outline-variant/50 px-3 py-1 text-on-surface font-label-caps text-[10px] rounded hover:bg-surface-variant transition-all" onClick={() => setShowWithdrawModal(true)}>WITHDRAW</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="relative text-on-surface-variant hover:text-primary transition-colors p-2">
                                    <span className="material-symbols-outlined">notifications</span>
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background"></span>
                                </button>
                                <button className="text-on-surface-variant hover:text-primary transition-colors p-2" onClick={toggleTheme}>
                                    <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                                </button>
                                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/profile')}>
                                    {walletInitials}
                                </div>
                                <button className="!bg-error/10 !text-error !px-4 !py-1.5 !font-label-caps !text-[10px] !rounded !h-auto !min-h-0 hover:!bg-error hover:!text-on-error transition-all" onClick={() => { signOut(); navigate('/'); }}>
                                    LOGOUT
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button className="text-on-surface-variant hover:text-primary transition-colors p-2" onClick={toggleTheme}>
                                <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                            </button>
                            <button 
                                className="bg-primary-container text-on-primary-container px-6 py-2.5 font-label-caps text-label-caps rounded-full font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,242,255,0.15)]"
                                onClick={() => navigate('/login')}
                            >
                                SIGN IN
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <Suspense fallback={null}>
                {(showDepositModal || showWithdrawModal) && (
                    <DepositWithdrawModals
                        showDepositModal={showDepositModal}
                        setShowDepositModal={setShowDepositModal}
                        showWithdrawModal={showWithdrawModal}
                        setShowWithdrawModal={setShowWithdrawModal}
                        profile={profile}
                        balance={availableCash * 100}
                        formattedBalance={formattedCash}
                    />
                )}
            </Suspense>
        </>
    );
};
