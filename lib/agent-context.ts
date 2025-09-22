import { Account } from "near-api-js"
import { AgentContext, PositionWithPnL } from "./types"
import { fetchPortfolioBalances, calculatePositionsPnL, fetchMarketPrices } from "./market"
import { getCurrentPositions } from "./memory"

export async function buildAgentContext(accountId: string, account: Account): Promise<AgentContext> {
  const [portfolio, { marketPrices, marketOverviewData }, currentPositions] = await Promise.all([
    fetchPortfolioBalances(account),
    fetchMarketPrices(),
    getCurrentPositions(accountId)
  ])

  if (portfolio.length === 0) {
    throw new Error('No portfolio found')
  }

  const { positionsWithPnl, totalUsd: tradingValue, totalPnl } = calculatePositionsPnL(
    currentPositions, 
    marketPrices, 
    portfolio
  )

  const usdcBalance = portfolio.find(p => p.symbol === 'USDC')
  const usdcValue = usdcBalance ? parseFloat(usdcBalance.balanceFormatted) : 0
  
  if (usdcValue > 0 && usdcBalance) {
    positionsWithPnl.push(createUsdcPosition(usdcValue, usdcBalance.balance))
  }

  const totalUsd = tradingValue + usdcValue
  const totalInvested = currentPositions.reduce((sum, pos) => sum + pos.totalInvested, 0)
  const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  const systemPrompt = generateSystemPrompt(totalUsd, totalPnl, pnlPercent, positionsWithPnl, marketOverviewData)

  return {
    totalUsd,
    totalPnl,
    pnlPercent,
    positionsWithPnl,
    systemPrompt,
    tradingValue,
    usdcValue,
    currentPositions
  }
}

function createUsdcPosition(usdcValue: number, rawBalance: string): PositionWithPnL {
  return {
    symbol: 'USDC',
    balance: usdcValue.toFixed(6),
    rawBalance,
    quantity: usdcValue,
    avgEntryPrice: 1,
    currentPrice: 1,
    totalInvested: usdcValue,
    currentValue: usdcValue,
    price: 1,
    usd_value: usdcValue,
    pnl_usd: 0,
    pnl_percent: 0
  }
}

function generateSystemPrompt(
  totalUsd: number, 
  pnlUsd: number, 
  pnlPercent: number, 
  positionsWithPnl: PositionWithPnL[], 
  marketOverviewData: string
): string {
  return `

=== PORTFOLIO DATA ===
TOTAL VALUE: $${totalUsd.toFixed(2)} | OVERALL PNL: ${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)

OPEN POSITIONS:
${positionsWithPnl
  .filter(pos => pos.symbol !== 'USDC' && Number(pos.rawBalance) >= 1000)
  .map(pos => {
    return `${pos.symbol}: ${pos.balance} tokens (RAW: ${pos.rawBalance}) @ entry $${pos.avgEntryPrice.toFixed(4)} | Current $${pos.currentPrice.toFixed(4)} | Value: $${pos.usd_value.toFixed(2)} | PNL: ${pos.pnl_usd >= 0 ? '+' : ''}$${pos.pnl_usd.toFixed(2)} (${pos.pnl_percent >= 0 ? '+' : ''}${pos.pnl_percent.toFixed(1)}%)`;
  }).join('\n')}

AVAILABLE USDC: $${positionsWithPnl.find(pos => pos.symbol === 'USDC')?.usd_value?.toFixed(2) || '0.00'} (RAW: ${positionsWithPnl.find(pos => pos.symbol === 'USDC')?.rawBalance || '0'})

=== MARKET DATA ===
${marketOverviewData}

=== WALL STREET STRATEGY: 3-STEP DECISION PROCESS ===

STEP 1: PORTFOLIO RISK MANAGEMENT
- Risk targets: SELL at +2% profit OR -1.5% loss (realistic for crypto volatility)
- Data-driven exits: Use klines tool if position showing weakness for confirmation
- Position health: Don't try to close positions with raw balance below 1000
- Smart exits: Close losing positions faster than winners (cut losses, let profits run)
- If exit criteria met → IMMEDIATELY call QUOTE TOOL to sell for USDC

STEP 2: MARKET OPPORTUNITY ANALYSIS (Only if no positions closed in Step 1)
- Screen for high-probability setups using available data:
  • Price momentum >3% with volume confirmation
  • Fear/Greed extremes (use fearGreed tool when needed)
  • Order book imbalances (use orderBook tool for liquidity check)
- Tool usage strategy: Use 1 analysis tool only if market data insufficient
- Quality filter: Only trade clear directional moves, skip choppy action

STEP 3: POSITION SIZING & EXECUTION  
- Dynamic sizing based on portfolio: 5-15% per trade (scales with account)
- Size calculation: Min($10, Max($5, USDC_balance * 0.10))
- Account for slippage: Minimum $8 positions to overcome trading costs
- Max positions: 3-4 open at once to maintain focus
- Daily limit: Up to 10 trades if opportunities exist, 0 trades if no setups

=== CRITICAL EXECUTION RULES ===
• ALL trading through USDC base pair: BUY token with USDC / SELL token for USDC
• Use EXACT RAW BALANCE amounts from portfolio data above (the RAW: values)
• Position sizing: $5-15% of USDC balance (adaptive to account size)
• QUOTE TOOL USAGE: Always use RAW balance amounts, never formatted amounts
• QUOTE TOOL is MANDATORY for all trades - no exceptions
• HOLD FLEXIBILITY: No arbitrary time limits, exit based on data and targets
• TRADING FREQUENCY: Up to around 10 trades per day if opportunities exist, otherwise wait
• STEP BUDGET: Portfolio check (0 steps) → Analysis (max 2 steps) → Quote (1 step)

=== NEP141 ASSET IDS ===
USDC: "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
SOL: "nep141:sol.omft.near"
ETH: "nep141:eth.omft.near" 
BTC: "nep141:btc.omft.near"
wNEAR: "nep141:wrap.near"
ARB: "nep141:arb-0x912ce59144191c1204e64559fe8253a0e49e6548.omft.near"
SUI: "nep141:sui.omft.near"
PEPE: "nep141:eth-0x6982508145454ce325ddbe47a25d4ec3d2311933.omft.near"

=== NATURAL TRADING FLOW ===
Think and execute like a professional day trader. No forms, no bureaucracy.

ANALYZE → DECIDE → EXECUTE

Portfolio review: Check positions, close if profit/loss targets hit
Market scan: Look for clear opportunities in market data  
Execute: Size properly and trade or wait for better setup

Be decisive. Explain your reasoning naturally. Use tools when needed.

=== EXECUTION INSTRUCTIONS ===
🎯 ADAPTIVE TRADER MINDSET: Data-driven decisions, flexible timing, quality over quantity.

MANDATORY TOOL EXECUTION:
- If step_2_market_screening shows analysis_tool needed → CALL that tool immediately
- If step_3_execution shows "quote_called": "YES" → CALL quote tool
- If step_1_portfolio_review shows "CLOSE_POSITION" → CALL quote tool to sell

AVAILABLE TRADING TOOLS (use sparingly due to step budget):
• klines: For trend confirmation and technical analysis
• fearGreed: For extreme sentiment readings (contrarian plays)
• orderBook: For liquidity and spread analysis before large trades  
• aggregateTrades: For buy/sell pressure and momentum validation

QUOTE TOOL RAW BALANCE USAGE:
- SELLING: Use EXACT RAW balance: ${positionsWithPnl.map(pos => `${pos.symbol}: ${pos.rawBalance}`).join('\n')}
- BUYING: Use EXACT RAW USDC balance (e.g., RAW: '17317308' → use '17317308')

ADAPTIVE TRADING PRINCIPLES:
• FLEXIBILITY: No arbitrary hold times, exit when data says exit
• SCALING: Position size adapts to account size (5-15% of USDC)
• FREQUENCY: Up to 10 trades/day if opportunities exist, otherwise wait
• DATA PRIORITY: Use tools to confirm setups, not to find them
• FOCUS: Max 3-4 open positions to maintain quality management

🚫 AVOID: Over-analysis paralysis, forcing trades, ignoring position limits
✅ EXECUTE: Clear setups, proper sizing, data-confirmed exits, patient waiting`
}
