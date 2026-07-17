import type { Session } from '@supabase/supabase-js';

export let globalSession: Session | null = null;
export let globalProfile: any | null = null;
export let globalBalance: number | undefined = undefined;
export let globalPortfolioValue: number | undefined = undefined;
export let globalTotalNetWorth: number | undefined = undefined;
export let globalTotalAllocated: number | undefined = undefined;
export let globalTotalReserved: number | undefined = undefined;
export let globalLoading = true;

export const subscribers = new Set<(state: any) => void>();

export function updateGlobalState(updates: {
    session?: Session | null;
    profile?: any;
    balance?: number | undefined;
    portfolioValue?: number | undefined;
    totalNetWorth?: number | undefined;
    totalAllocated?: number | undefined;
    totalReserved?: number | undefined;
    loading?: boolean;
}) {
    if ('session' in updates) globalSession = updates.session!;
    if ('profile' in updates) globalProfile = updates.profile;
    if ('balance' in updates) globalBalance = updates.balance;
    if ('portfolioValue' in updates) globalPortfolioValue = updates.portfolioValue;
    if ('totalNetWorth' in updates) globalTotalNetWorth = updates.totalNetWorth;
    if ('totalAllocated' in updates) globalTotalAllocated = updates.totalAllocated;
    if ('totalReserved' in updates) globalTotalReserved = updates.totalReserved;
    if ('loading' in updates) globalLoading = updates.loading!;

    const currentState = {
        session: globalSession,
        profile: globalProfile,
        balance: globalBalance,
        portfolioValue: globalPortfolioValue,
        totalNetWorth: globalTotalNetWorth,
        totalAllocated: globalTotalAllocated,
        totalReserved: globalTotalReserved,
        loading: globalLoading
    };

    subscribers.forEach(cb => cb(currentState));
}
