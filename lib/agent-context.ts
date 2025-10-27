import type { Account } from 'near-api-js'
import { calculatePositionsPnL, fetchMarketPrices, fetchPortfolioBalances } from './market'
import { getCurrentPositions } from './api-helpers'
import type { AgentContext, PositionWithPnL } from './types'
import { TOKEN_LIST } from './utils'
import { getEnvStrategy } from './strategies'

export async function buildAgentContext(
  accountId: string,
  account: Account
): Promise<AgentContext> {
  const [portfolio, { marketPrices, marketOverviewData }, currentPositions] = await Promise.all([
    fetchPortfolioBalances(account),
    fetchMarketPrices(),
    getCurrentPositions(accountId),
  ])

  if (portfolio.length === 0) {
    console.warn(
      `No on-chain balances found for account ${accountId}, continuing with empty portfolio context`
    )
  }

  const {
    positionsWithPnl,
    totalUsd: tradingValue,
    totalPnl,
  } = calculatePositionsPnL(currentPositions, marketPrices, portfolio)

  const usdcBalance = portfolio.find((p) => p.symbol === 'USDC')
  const usdcValue = usdcBalance ? parseFloat(usdcBalance.balanceFormatted) : 0

  if (usdcValue > 0 && usdcBalance) {
    positionsWithPnl.push(createUsdcPosition(usdcValue, usdcBalance.balance))
  }

  const totalUsd = tradingValue + usdcValue
  const totalInvested = currentPositions.reduce((sum, pos) => sum + pos.totalInvested, 0)
  const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  const systemPrompt = generateSystemPrompt(
    totalUsd,
    totalPnl,
    pnlPercent,
    positionsWithPnl,
    marketOverviewData,
    accountId
  )

  return {
    totalUsd,
    totalPnl,
    pnlPercent,
    positionsWithPnl,
    systemPrompt,
    tradingValue,
    usdcValue,
    currentPositions,
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
    pnl_percent: 0,
  }
}

function generateSystemPrompt(
  totalUsd: number,
  pnlUsd: number,
  pnlPercent: number,
  positionsWithPnl: PositionWithPnL[],
  marketOverviewData: string,
  accountId: string
): string {
  const strategy = getEnvStrategy()

  const tradingPositions = positionsWithPnl.filter(
    (pos) => pos.symbol !== 'USDC' && Number(pos.rawBalance) >= 1000
  )
  const usdcPosition = positionsWithPnl.find((pos) => pos.symbol === 'USDC')

  return `

🤖 AUTONOMOUS TRADING AGENT - ONE-SHOT EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: You have ONE response to analyze and execute.
If you decide to trade, you MUST call QUOTE in THIS response.
There is no "next time" - trades not executed now will NOT happen.
Your near account id is: ${accountId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORTFOLIO STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Value: $${totalUsd.toFixed(2)}
Overall P&L: ${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)} (${
    pnlPercent >= 0 ? '+' : ''
  }${pnlPercent.toFixed(2)}%)

┌─ OPEN POSITIONS ─────────────────────────────────────┐
${
  tradingPositions.length > 0
    ? tradingPositions
        .map((pos) => {
          const exitSignal =
            pos.pnl_percent >= strategy.riskParams.profitTarget
              ? '🟢 PROFIT'
              : pos.pnl_percent <= strategy.riskParams.stopLoss
                ? '🔴 STOP'
                : '⚪ HOLD'

          return `│ ${pos.symbol.padEnd(6)} [${exitSignal}] P&L: ${
            pos.pnl_percent >= 0 ? '+' : ''
          }${pos.pnl_percent.toFixed(2)}%
│   Entry: $${pos.avgEntryPrice.toFixed(4)} → Current: $${pos.currentPrice.toFixed(4)}
│   Value: $${pos.usd_value.toFixed(2)}
│   QUOTE amount: "${pos.rawBalance}"`
        })
        .join('\n│\n')
    : '│ No positions'
}
└──────────────────────────────────────────────────────┘

Available USDC: $${(usdcPosition?.usd_value || 0).toFixed(2)}
QUOTE amount: "${usdcPosition?.rawBalance || '0'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKET CONDITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${marketOverviewData}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADING STRATEGY: ${strategy.overview}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: PORTFOLIO RISK MANAGEMENT (Selling) - MANDATORY CHECK
────────────────────────────────────────────────────────
${strategy.step1Rules}

IMMEDIATE EXIT TRIGGERS (Close NOW):
• 🟢 PROFIT TARGET: P&L >= +${strategy.riskParams.profitTarget}%
• 🔴 STOP LOSS: P&L <= ${strategy.riskParams.stopLoss}%

MOMENTUM EXIT SIGNALS (Consider closing):
• 🟡 STALLING: Position flat (-0.5% to +0.5%) for extended time
• 🟡 REVERSAL: Price turning against position after partial profit
• 🟡 OPPORTUNITY COST: Better setups available but no capital
• 🟡 WEAK MOMENTUM: Volume declining, momentum indicators weakening

Decision Matrix:
• Hard triggers (🟢🔴) → MUST CLOSE via QUOTE
• Soft triggers (🟡) + Better opportunity → SHOULD CLOSE via QUOTE
• Multiple soft triggers → STRONGLY CONSIDER CLOSING
• No triggers + Strong momentum → Hold

STEP 2: MARKET OPPORTUNITY ANALYSIS
────────────────────────────────────────────────────────
${strategy.step2Rules}

Analysis tools (optional):
• klines: Price action and trends
• fearGreed: Market sentiment
• orderBook: Liquidity analysis
• aggregateTrades: Buy/sell pressure

Decision → Action Mapping:
• If you find an opportunity → CALL QUOTE TOOL NOW
• If no clear setup → Wait (no action)

STEP 3: POSITION SIZING & EXECUTION (Buying)
────────────────────────────────────────────────────────
${strategy.step3Rules}

Constraints:
• Position size: ${strategy.riskParams.positionSize} of USDC
• Max positions: ${strategy.riskParams.maxPositions}
• Min position: $8 after slippage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUOTE TOOL USAGE (HOW TO EXECUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you decide to trade, call QUOTE with:
• amount: Use exact values shown above (e.g., "179578108")
• Never use formatted amounts (e.g., not "0.179640")
• Recipient and refund fields on the quote are always ${accountId}
• NEVER halucinate a random account id for the recipient or refund fields

Asset IDs:
${TOKEN_LIST.map((token) => `${token.symbol}: "${token.assetId}"`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ANALYZE: Review positions and market conditions
2. DECIDE: Determine if any action is needed
3. EXECUTE: If action needed → CALL QUOTE TOOL NOW

⚠️ CRITICAL EXECUTION RULES:
• This is your ONLY chance - no second attempts
• Every decision REQUIRES a QUOTE tool call
• "I would..." or "I recommend..." = FAILURE TO EXECUTE
• NEVER claim you traded without calling QUOTE
• Be DECISIVE - uncertainty = close position

You have FULL trading authority. No approval needed.
Execute your analysis immediately via QUOTE tool.`
}

export const AGENT_TRIGGER_MESSAGE = `Execute your trading strategy with active portfolio management:

STEP 1 - POSITION REVIEW: Evaluate every open position against your exit criteria. Check if any positions should be closed based on your strategy rules, market conditions, or opportunity cost. Active capital rotation often outperforms passive holding.

STEP 2 - OPPORTUNITY ASSESSMENT: After managing existing positions, scan for new opportunities that meet your entry criteria. Focus on high-conviction setups that align with your strategy parameters.

STEP 3 - BUYING (IMMEDIATE EXECUTION): This is your ONLY chance to act. Execute all trading decisions NOW via the QUOTE tool. Analysis without execution accomplishes nothing.

Remember: Locked capital in underperforming positions prevents capturing new opportunities. Be decisive and systematic in your approach.`
