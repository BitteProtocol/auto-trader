import type { Account } from "near-api-js";
import {
  calculatePositionsPnL,
  fetchMarketPrices,
  fetchPortfolioBalances,
} from "./market";
import { getCurrentPositions } from "./api-helpers";
import type { AgentContext, PositionWithPnL } from "./types";
import { TOKEN_LIST } from "./utils";
import { DEFAULT_STRATEGY } from "./strategies";
import type { StrategyConfig } from "./strategies";

export async function buildAgentContext(
	accountId: string,
	account: Account,
	strategyConfig?: StrategyConfig,
): Promise<AgentContext> {
	const [portfolio, { marketPrices, marketOverviewData }, currentPositions] =
		await Promise.all([
			fetchPortfolioBalances(account),
			fetchMarketPrices(),
			getCurrentPositions(accountId),
		]);

	if (portfolio.length === 0) {
		console.warn(
			`No on-chain balances found for account ${accountId}, continuing with empty portfolio context`,
		);
	}

	const {
		positionsWithPnl,
		totalUsd: tradingValue,
		totalPnl,
	} = calculatePositionsPnL(currentPositions, marketPrices, portfolio);

	const usdcBalance = portfolio.find((p) => p.symbol === "USDC");
	const usdcValue = usdcBalance ? parseFloat(usdcBalance.balanceFormatted) : 0;

	if (usdcValue > 0 && usdcBalance) {
		positionsWithPnl.push(createUsdcPosition(usdcValue, usdcBalance.balance));
	}

	const totalUsd = tradingValue + usdcValue;
	const totalInvested = currentPositions.reduce(
		(sum, pos) => sum + pos.totalInvested,
		0,
	);
	const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

	const systemPrompt = generateSystemPrompt(
		totalUsd,
		totalPnl,
		pnlPercent,
		positionsWithPnl,
		marketOverviewData,
		strategyConfig,
	);

	return {
		totalUsd,
		totalPnl,
		pnlPercent,
		positionsWithPnl,
		systemPrompt,
		tradingValue,
		usdcValue,
		currentPositions,
	};
}

function createUsdcPosition(
	usdcValue: number,
	rawBalance: string,
): PositionWithPnL {
	return {
		symbol: "USDC",
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
	};
}

function generateSystemPrompt(
	totalUsd: number,
	pnlUsd: number,
	pnlPercent: number,
	positionsWithPnl: PositionWithPnL[],
	marketOverviewData: string,
	strategyConfig?: StrategyConfig,
): string {
	const strategy = strategyConfig || DEFAULT_STRATEGY;
	return `

=== PORTFOLIO DATA ===
TOTAL VALUE: $${totalUsd.toFixed(2)} | OVERALL PNL: ${pnlUsd >= 0 ? "+" : ""}$${pnlUsd.toFixed(2)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%)

OPEN POSITIONS:
${positionsWithPnl
	.filter((pos) => pos.symbol !== "USDC" && Number(pos.rawBalance) >= 1000)
	.map((pos) => {
		return `${pos.symbol}: ${pos.balance} tokens (RAW: ${pos.rawBalance}) @ entry $${pos.avgEntryPrice.toFixed(4)} | Current $${pos.currentPrice.toFixed(4)} | Value: $${pos.usd_value.toFixed(2)} | PNL: ${pos.pnl_usd >= 0 ? "+" : ""}$${pos.pnl_usd.toFixed(2)} (${pos.pnl_percent >= 0 ? "+" : ""}${pos.pnl_percent.toFixed(1)}%)`;
	})
	.join("\n")}

AVAILABLE USDC: $${positionsWithPnl.find((pos) => pos.symbol === "USDC")?.usd_value?.toFixed(2) || "0.00"} (RAW: ${positionsWithPnl.find((pos) => pos.symbol === "USDC")?.rawBalance || "0"})

=== MARKET DATA ===
${marketOverviewData}

=== NEP141 ASSET IDS ===
${TOKEN_LIST.map((token) => `${token.symbol}: "${token.assetId}"`).join("\n")}

=== TRADING STRATEGY: 3-STEP DECISION PROCESS ===
${strategy.overview}

STEP 1: PORTFOLIO RISK MANAGEMENT
${strategy.step1Rules}
- Profit target: +${strategy.riskParams.profitTarget}%
- Stop loss: ${strategy.riskParams.stopLoss}%
- Don't close positions with raw balance below 1000
- If exit criteria met → IMMEDIATELY call QUOTE TOOL to sell for USDC

STEP 2: MARKET OPPORTUNITY ANALYSIS (Only if no positions closed in Step 1)
${strategy.step2Rules}
- Use available tools: klines, fearGreed, orderBook, aggregateTrades
- Tool usage strategy: Use 1 analysis tool only if market data insufficient

STEP 3: POSITION SIZING & EXECUTION
${strategy.step3Rules}
- Position sizing: ${strategy.riskParams.positionSize}
- Max positions: ${strategy.riskParams.maxPositions} open at once
- Trade when opportunities exist, wait for quality setups


=== CRITICAL EXECUTION RULES ===
• ALL trading through USDC base pair: BUY token with USDC / SELL token for USDC
• Use EXACT RAW BALANCE amounts from portfolio data above (the RAW: values)
• Position sizing: ${strategy.riskParams.positionSize} of USDC balance (adaptive to account size)
• QUOTE TOOL USAGE: Always use RAW balance amounts, never formatted amounts
• QUOTE TOOL is MANDATORY for all trades - no exceptions
• HOLD FLEXIBILITY: No arbitrary time limits, exit based on data and targets
• TRADING FREQUENCY: Trade when opportunities exist, otherwise wait for quality setups
• STEP BUDGET: Portfolio check (0 steps) → Analysis (max 2 steps) → Quote (1 step)

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
- SELLING: Use EXACT RAW balance: ${positionsWithPnl.map((pos) => `${pos.symbol}: ${pos.rawBalance}`).join("\n")}
- BUYING: Use EXACT RAW USDC balance (e.g., RAW: '17317308' → use '17317308')

ADAPTIVE TRADING PRINCIPLES:
• FLEXIBILITY: No arbitrary hold times, exit when data says exit
• SCALING: Position size adapts to account size (${strategy.riskParams.positionSize} of USDC)
• FREQUENCY: Trade when opportunities exist, otherwise wait for quality setups
• DATA PRIORITY: Use tools to confirm setups, not to find them
• FOCUS: Max ${strategy.riskParams.maxPositions} open positions to maintain quality management

🚫 AVOID: Over-analysis paralysis, forcing trades, ignoring position limits
✅ EXECUTE: Clear setups, proper sizing, data-confirmed exits, patient waiting`;
}
