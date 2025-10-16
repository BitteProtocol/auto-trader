import type { StrategyConfig } from "./types";

export type { StrategyConfig } from "./types";

export const DEFAULT_STRATEGY: StrategyConfig = {
  overview:
    "Wall Street 3-Step: Data-driven day trading with clear profit/loss targets and risk management",
  riskParams: {
    profitTarget: 2,
    stopLoss: -1.5,
    maxPositions: 4,
    positionSize: "5-15% of USDC",
  },
  step1Rules:
    "Risk targets: SELL at +2% profit OR -1.5% loss. Close losing positions faster than winners (cut losses, let profits run). Don't close positions with raw balance below 1000.",
  step2Rules:
    "Screen for high-probability setups: Price momentum >3% with volume confirmation, Fear/Greed extremes, Order book imbalances. Use 1 analysis tool only if market data insufficient. Only trade clear directional moves.",
  step3Rules:
    "Dynamic sizing: 5-15% per trade (scales with account). Size calculation: Min($10, Max($5, USDC_balance * 0.10)). Account for slippage: Minimum $8 positions. Max 3-4 open positions at once.",
};
