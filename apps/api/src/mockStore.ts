import type { 
  MockMarket, MockPosition, MockTransaction, MockFraudAlert
} from "./mockStore/data";
import {
  initialMockMarkets, initialMockPositions, initialMockTransactions, initialMockFraudAlerts 
} from "./mockStore/data";

export type { MockMarket, MockPosition, MockTransaction, MockFraudAlert };

export const mockMarkets: MockMarket[] = [...initialMockMarkets];
export const mockPositions: MockPosition[] = [...initialMockPositions];
export const mockTransactions: MockTransaction[] = [...initialMockTransactions];
export const mockFraudAlerts: MockFraudAlert[] = [...initialMockFraudAlerts];
