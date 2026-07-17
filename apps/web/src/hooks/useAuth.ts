import { useState, useEffect, useCallback } from 'react';
import { 
  globalSession, globalProfile, globalBalance, globalPortfolioValue, 
  globalTotalNetWorth, globalLoading, subscribers, updateGlobalState 
} from './auth/authState';
import { startBalancePolling, stopBalancePolling, fetchBalance } from './auth/authPolling';
import { decodeClaims } from './auth/authHelpers';

let isAuthListenerInitialized = false;

export function useAuth() {
    // Subscribe local component state to global variables
    const [state, setState] = useState({
        session: globalSession,
        profile: globalProfile,
        balance: globalBalance,
        portfolioValue: globalPortfolioValue,
        totalNetWorth: globalTotalNetWorth,
        loading: globalLoading
    });

    useEffect(() => {
        const handler = (newState: typeof state) => {
            setState(newState);
        };
        subscribers.add(handler);
        return () => {
            subscribers.delete(handler);
        };
    }, []);

    // Set up auth state listener once globally
    useEffect(() => {
        if (isAuthListenerInitialized) return;
        isAuthListenerInitialized = true;

        const syncSession = () => {
            try {
                const raw = localStorage.getItem('user');
                const token = localStorage.getItem('access_token');
                
                const profile = raw ? JSON.parse(raw) : null;
                const session = (token && raw) ? ({ access_token: token, user: JSON.parse(raw) } as any) : null;
                
                const cachedBalanceStr = localStorage.getItem('balance');
                const cachedPortfolioValueStr = localStorage.getItem('portfolioValue');
                const cachedTotalNetWorthStr = localStorage.getItem('totalNetWorth');
                const cachedTotalAllocatedStr = localStorage.getItem('totalAllocated');
                const cachedTotalReservedStr = localStorage.getItem('totalReserved');
                
                const balance = cachedBalanceStr ? parseInt(cachedBalanceStr) : undefined;
                const portfolioValue = cachedPortfolioValueStr ? parseInt(cachedPortfolioValueStr) : undefined;
                const totalNetWorth = cachedTotalNetWorthStr ? parseInt(cachedTotalNetWorthStr) : undefined;
                const totalAllocated = cachedTotalAllocatedStr ? parseInt(cachedTotalAllocatedStr) : undefined;
                const totalReserved = cachedTotalReservedStr ? parseInt(cachedTotalReservedStr) : undefined;

                updateGlobalState({ 
                    session, 
                    profile, 
                    balance,
                    portfolioValue,
                    totalNetWorth,
                    totalAllocated,
                    totalReserved,
                    loading: false 
                });

                if (session?.access_token) {
                    fetchBalance(true);
                }
            } catch {
                updateGlobalState({ session: null, profile: null, loading: false });
            }
        };

        syncSession();

        window.addEventListener('auth-change', syncSession);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const wsUrl = API_URL.replace(/^http/, "ws") + "/api/ws";
        let ws: WebSocket;
        const connectWs = () => {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "PORTFOLIO_UPDATE") {
                        window.dispatchEvent(new Event('balance-change'));
                    }
                } catch (e) {
                    console.error("Global WS message error:", e);
                }
            };
            ws.onclose = () => {
                setTimeout(connectWs, 5000);
            };
        };
        connectWs();

        return () => {
            window.removeEventListener('auth-change', syncSession);
            if (ws) ws.close();
        };
    }, []);

    // Start/stop polling based on global session state
    useEffect(() => {
        if (state.session?.access_token) {
            startBalancePolling();
        } else {
            stopBalancePolling();
        }
    }, [state.session]);

    const user: any = state.session?.user ?? null;

    // Decode JWT payload to get claims using helper
    let claims: any = null;
    let loginTime: string | null = null;
    let userId: string | null = null;
    let publicKey: string | null = null;

    if (state.session?.access_token) {
        const decoded = decodeClaims(state.session.access_token);
        if (decoded) {
            claims = decoded.claims;
            userId = decoded.userId;
            publicKey = decoded.publicKey;
            loginTime = decoded.loginTime;
        }
    } else if (user) {
        userId = user.id;
        publicKey = user.wallet || null;
    }

    const signOut = useCallback(async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('balance');
        localStorage.removeItem('portfolioValue');
        localStorage.removeItem('totalNetWorth');
        localStorage.removeItem('totalAllocated');
        localStorage.removeItem('totalReserved');
        updateGlobalState({ 
            session: null, 
            profile: null, 
            balance: undefined, 
            portfolioValue: undefined, 
            totalNetWorth: undefined,
            totalAllocated: undefined,
            totalReserved: undefined
        });
        window.dispatchEvent(new Event('auth-change'));
    }, []);

    const refetchBalance = useCallback(() => {
        window.dispatchEvent(new Event('balance-change'));
    }, []);

    return {
        session: state.session,
        isLoggedIn: !!state.session,
        loading: state.loading,
        user,
        claims,
        userId,
        publicKey,
        loginTime,
        profile: state.profile,
        balance: state.balance,
        portfolioValue: state.portfolioValue,
        totalNetWorth: state.totalNetWorth,
        totalAllocated: (state as any).totalAllocated,
        totalReserved: (state as any).totalReserved,
        refetchBalance,
        signOut,
    };
}
