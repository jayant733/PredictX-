import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolioState } from '../../hooks/usePortfolioState';

export const Sidebar: React.FC = () => {
    const { isLoggedIn, claims } = useAuth();
    const { totalEquity } = usePortfolioState();
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;
    
    const totalValue = `$${totalEquity.toFixed(2)}`;

    return (
        <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-surface-container-lowest/90 backdrop-blur-lg border-r border-outline-variant/20 shadow-2xl flex flex-col pt-20 hidden md:flex">
            <div className="flex flex-col gap-1 px-2">
                <a 
                    className={`flex items-center gap-4 px-6 py-4 transition-all cursor-pointer ${currentPath === '/dashboard' || currentPath === '/' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'}`}
                    onClick={() => navigate('/dashboard')}
                >
                    <span className="material-symbols-outlined">explore</span>
                    <span className="font-body-md text-body-md">Explore</span>
                </a>
                <a 
                    className={`flex items-center gap-4 px-6 py-4 transition-all cursor-pointer ${currentPath === '/portfolio' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'}`}
                    onClick={() => isLoggedIn ? navigate('/portfolio') : navigate('/login')}
                >
                    <span className="material-symbols-outlined">pie_chart</span>
                    <span className="font-body-md text-body-md">Portfolio</span>
                </a>
                <a 
                    className={`flex items-center gap-4 px-6 py-4 transition-all cursor-pointer ${currentPath === '/ai-trading' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'}`}
                    onClick={() => isLoggedIn ? navigate('/ai-trading') : navigate('/login')}
                >
                    <span className="material-symbols-outlined">smart_toy</span>
                    <span className="font-body-md text-body-md">Trade with AI</span>
                </a>
                <a className="text-on-surface-variant flex items-center gap-4 px-6 py-4 hover:bg-surface-variant/30 hover:text-on-surface transition-all active:translate-x-1 cursor-pointer" onClick={() => navigate('/profile')}>
                    <span className="material-symbols-outlined">settings</span>
                    <span className="font-body-md text-body-md">Settings</span>
                </a>
            </div>
            {isLoggedIn && claims && (
                <div className="mt-auto p-6">
                    <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-outline font-label-caps">PORTFOLIO</span>
                        </div>
                        <div className="font-headline-md text-primary">
                            {totalValue}
                        </div>
                        <button className="w-full mt-4 bg-primary-container text-on-primary-container py-2 rounded-lg font-label-caps tracking-widest hover:brightness-110 active:scale-[0.98] transition-all" onClick={() => navigate('/portfolio')}>TRADE NOW</button>
                    </div>
                </div>
            )}
        </aside>
    );
};
