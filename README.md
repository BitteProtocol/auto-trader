# Auto Trader Agent 

An autonomous crypto trading agent that references market decisions and then uses near intents to execute trades across many chains via a single near account

![Auto Trader Agent Demo](https://i.imgur.com/rMkqcji.png)

## Trading Strategy System

Simple strategy customization - just pass a config object to override the default Wall Street strategy.


### Default Strategy

The system comes with a proven Wall Street 3-step strategy:

```typescript
// From lib/strategies/index.ts
export const DEFAULT_STRATEGY: StrategyConfig = {
  overview: "Wall Street 3-Step: Data-driven day trading with clear profit/loss targets and risk management",
  riskParams: {
    profitTarget: 2,      // +2% profit target
    stopLoss: -1.5,       // -1.5% stop loss
    maxPositions: 4,      // Max 4 open positions
    positionSize: "5-15% of USDC"
  },
  step1Rules: "Risk targets: SELL at +2% profit OR -1.5% loss. Close losing positions faster than winners (cut losses, let profits run). .",
  step2Rules: "Screen for high-probability setups: Price momentum >3% with volume confirmation, Fear/Greed extremes, Order book imbalances. Use 1 analysis tool only if market data insufficient. Only trade clear directional moves.",
  step3Rules: "Dynamic sizing: 5-15% per trade (scales with account). Size calculation: Min($10, Max($5, USDC_balance * 0.10)). Account for slippage: Minimum $8 positions. Max 3-4 open positions at once."
};
```

### Available Tools

All strategies have access to these trading tools:
- `klines`: Trend confirmation, support/resistance levels
- `fearGreed`: Market sentiment (0-100 scale, <20 = fear, >80 = greed)
- `orderBook`: Liquidity depth and spread analysis
- `aggregateTrades`: Buy/sell pressure and momentum
- `quote`: **MANDATORY** for all trades (always use raw balances)

### Strategy Template

```typescript
const template: StrategyConfig = {
  overview: "Your Strategy Name: What does your strategy do?",
  riskParams: {
    profitTarget: 2,           // % profit to exit
    stopLoss: -1.5,           // % loss to exit  
    maxPositions: 4,          // Max open positions
    positionSize: "5-15% of USDC" // Position sizing
  },
  step1Rules: "When and how to close existing positions...",
  step2Rules: "What market conditions to look for...", 
  step3Rules: "How to size and execute new positions..."
};
```

### Core Infrastructure

- All trading through USDC pairs
- Same asset list and tools  
- Same execution rules
- Same portfolio tracking
- Same API integration
