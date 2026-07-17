import { globalSession, updateGlobalState } from './authState';

export let isBalancePollingInitialized = false;
export let pollingIntervalId: any = null;
export let isFetchingBalance = false;

export const fetchBalance = (force = false) => {
    if (!globalSession?.access_token) {
        updateGlobalState({
            balance: undefined,
            portfolioValue: undefined,
            totalNetWorth: undefined
        });
        return;
    }

    if (isFetchingBalance && !force) return;
    isFetchingBalance = true;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/api/balance`, {
        headers: {
            'Authorization': `Bearer ${globalSession.access_token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        isFetchingBalance = false;
        if (data && typeof data.balanceUsd === 'number') {
            localStorage.setItem('balance', data.balanceUsd.toString());
            localStorage.setItem('portfolioValue', (data.portfolioValueUsd ?? 0).toString());
            localStorage.setItem('totalNetWorth', (data.totalNetWorth ?? data.balanceUsd).toString());
            localStorage.setItem('totalAllocated', (data.totalAllocatedCents ?? 0).toString());
            localStorage.setItem('totalReserved', (data.totalReservedCents ?? 0).toString());
            updateGlobalState({
                balance: data.balanceUsd,
                portfolioValue: data.portfolioValueUsd,
                totalNetWorth: data.totalNetWorth,
                totalAllocated: data.totalAllocatedCents ?? 0,
                totalReserved: data.totalReservedCents ?? 0
            });
        }
    })
    .catch(err => {
        isFetchingBalance = false;
        console.error("Failed to fetch portfolio summary:", err);
    });
};

const handleBalanceChangeEvent = () => {
    fetchBalance(true);
};

export const startBalancePolling = () => {
    if (isBalancePollingInitialized) return;
    isBalancePollingInitialized = true;

    // Initial fetch
    fetchBalance();

    // Listen for balance change events across different component instances
    window.addEventListener('balance-change', handleBalanceChangeEvent);

    // Poll balance every 3 seconds for continuous synchronization
    pollingIntervalId = setInterval(() => fetchBalance(false), 3000);
};

export const stopBalancePolling = () => {
    isBalancePollingInitialized = false;
    window.removeEventListener('balance-change', handleBalanceChangeEvent);
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
};
