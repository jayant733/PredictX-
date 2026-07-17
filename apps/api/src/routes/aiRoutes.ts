import { handleGetAiInsights, handleGetAiRecommend } from "./ai/insights";
import { handlePostAiChat } from "./ai/chat";
import { handlePostAiPortfolioAnalyze } from "./ai/portfolio";
import { handlePostAiMarketGenerate, handlePostAiMarketIntelligence } from "./ai/market";
import { handleGetAiTraders, handlePostAiTradersCycle, handleGetAiTradersSettings, handlePostAiTradersSettings, handlePostStopAllAiTraders, handleGetAiTradersLedger, handleGetAiTradersAnalytics } from "./ai/traders";

export {
  handleGetAiInsights,
  handleGetAiRecommend,
  handlePostAiChat,
  handlePostAiPortfolioAnalyze,
  handlePostAiMarketGenerate,
  handlePostAiMarketIntelligence,
  handleGetAiTraders,
  handlePostAiTradersCycle,
  handleGetAiTradersSettings,
  handlePostAiTradersSettings,
  handlePostStopAllAiTraders,
  handleGetAiTradersLedger,
  handleGetAiTradersAnalytics
};
