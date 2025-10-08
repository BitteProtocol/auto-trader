export interface StrategyConfig {
  overview: string;
  riskParams: {
    profitTarget: number;
    stopLoss: number;
    maxPositions: number;
    positionSize: string;
  };
  step1Rules: string;
  step2Rules: string;
  step3Rules: string;
}
