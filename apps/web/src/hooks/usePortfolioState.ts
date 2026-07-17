import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface PortfolioState {
  availableCash: number;     // Available Cash in USD (from balanceUsd)
  marketValue: number;       // Market Value of Holdings in USD (from portfolioValueUsd)
  totalEquity: number;       // Total Equity in USD (from totalNetWorth)
  allocatedCash: number;     // Allocated Cash in USD
  reservedCash: number;      // Reserved Cash in USD
  delegatedCash: number;     // Delegated Cash in USD (allocated + reserved)
  buyingPower: number;       // Buying Power in USD (available + allocated)
  refetch: () => void;
  isLoggedIn: boolean;
}

export function usePortfolioState(): PortfolioState {
  const { 
    balance, 
    portfolioValue, 
    totalNetWorth, 
    totalAllocated, 
    totalReserved, 
    refetchBalance,
    isLoggedIn 
  } = useAuth();

  return useMemo(() => {
    const cashVal = balance !== undefined ? balance : 0;
    const holdVal = portfolioValue !== undefined ? portfolioValue : 0;
    const allocVal = totalAllocated !== undefined ? totalAllocated : 0;
    const resVal = totalReserved !== undefined ? totalReserved : 0;
    
    // Calculate total net worth if not provided
    const netWorthVal = totalNetWorth !== undefined ? totalNetWorth : (cashVal + holdVal + allocVal + resVal);

    return {
      availableCash: cashVal / 100,
      marketValue: holdVal / 100,
      totalEquity: netWorthVal / 100,
      allocatedCash: allocVal / 100,
      reservedCash: resVal / 100,
      delegatedCash: (allocVal + resVal) / 100,
      buyingPower: (cashVal + allocVal) / 100,
      refetch: refetchBalance,
      isLoggedIn
    };
  }, [balance, portfolioValue, totalNetWorth, totalAllocated, totalReserved, refetchBalance, isLoggedIn]);
}
