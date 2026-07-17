import { AgentState } from "./state";
import { runNewsAgent, runTwitterAgent, runCryptoAgent, runMarketAgent } from "./nodes";
import { runCompilerAgent } from "./compiler";

// 4. State Graph Orchestrator (Simulating LangGraph Execution Flow)
export async function executeMarketIntelligence(
  marketId: string,
  query: string,
  onStepProgress?: (stepName: string, partialState: AgentState) => void
): Promise<AgentState> {
  let state: AgentState = {
    query,
    marketId,
    steps: []
  };

  // Node 1: News
  const newsRes = await runNewsAgent(state);
  state = { ...state, ...newsRes } as AgentState;
  if (onStepProgress) onStepProgress("News Agent", state);

  // Node 2: Twitter
  const twitterRes = await runTwitterAgent(state);
  state = { ...state, ...twitterRes } as AgentState;
  if (onStepProgress) onStepProgress("Twitter Agent", state);

  // Node 3: Crypto Data
  const cryptoRes = await runCryptoAgent(state);
  state = { ...state, ...cryptoRes } as AgentState;
  if (onStepProgress) onStepProgress("Crypto Data Agent", state);

  // Node 4: Market Data
  const marketRes = await runMarketAgent(state);
  state = { ...state, ...marketRes } as AgentState;
  if (onStepProgress) onStepProgress("Market Data Agent", state);

  // Node 5: Compiler
  const compilerRes = await runCompilerAgent(state);
  state = { ...state, ...compilerRes } as AgentState;
  if (onStepProgress) onStepProgress("Compiler Agent", state);

  return state;
}
