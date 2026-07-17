/**
 * mockStore/data.ts
 * 
 * This file provides empty fallback arrays and TypeScript interfaces.
 * All real data is fetched from the live database (PostgreSQL via Polymarket sync).
 * 
 * The empty arrays ensure that if the database is unreachable, the app
 * returns empty states gracefully instead of serving stale fake data.
 */

export interface MockMarket {
  id: string;
  question: string;
  category: string;
  description: string;
  status: string;
  resolutionOutcome: string | null;
  yesPrice: number;
  noPrice: number;
  volumeUsd: number;
  endTime: Date;
  createdAt: Date;
}

export interface MockPosition {
  id: string;
  userId: string;
  marketId: string;
  outcome: string;
  quantity: number;
  averageBuyPrice: number;
  createdAt: Date;
}

export interface MockTransaction {
  id: string;
  userId: string;
  type: string;
  amountUsd: number;
  details: any;
  createdAt: Date;
}

export interface MockFraudAlert {
  id: string;
  marketId: string | null;
  userId: string | null;
  type: string;
  severity: string;
  description: string;
  status: string;
  createdAt: Date;
}

// All arrays are empty — live data is fetched from Polymarket via the database
export const initialMockMarkets: MockMarket[] = [];
export const initialMockPositions: MockPosition[] = [];
export const initialMockTransactions: MockTransaction[] = [];
export const initialMockFraudAlerts: MockFraudAlert[] = [];
