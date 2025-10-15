
export interface Token {
	assetId: string;
	decimals: number;
	blockchain: string;
	symbol: string;
	contractAddress?: string;
	price?: number;
	priceUpdatedAt?: string;
}

export interface ToolResult {
	toolCallId: string
	result: {
	  data: {
		success: boolean
		data: {
		  quote?: Quote
		}
	  }
	}
}

export interface TokenBalance {
	assetId: string;
	symbol: string;
	balance: string;
	decimals: number;
	balanceFormatted: string;
}

export interface MarketPrice {
	symbol: string;
	price: number;
	priceChange: number;
	priceChangePercent: number;
	volume: number;
	quoteVolume: number;
	high: number;
	low: number;
	openPrice: number;
	trades: number;
}

export interface CurrentPosition {
	asset: string;
	quantity: number;
	avgEntryPrice: number;
	totalInvested: number;
}

export interface PositionWithPnL {
	symbol: string;
	balance: string;
	rawBalance: string;
	quantity: number;
	avgEntryPrice: number;
	currentPrice: number;
	totalInvested: number;
	currentValue: number;
	price: number;
	usd_value: number;
	pnl_usd: number;
	pnl_percent: number;
}

export interface Quote {
	originAsset: string;
	destinationAsset: string;
	amountIn: string;
	amountInFormatted: string;
	amountOut: string;
	amountOutFormatted: string;
	minAmountOut: string;
	depositAddress: string;
	deadline: string;
	timeEstimate: number;
	signature: string;
	timestamp: string;
}


export interface AgentContext {
	totalUsd: number;
	totalPnl: number;
	pnlPercent: number;
	positionsWithPnl: PositionWithPnL[];
	systemPrompt: string;
	tradingValue: number;
	usdcValue: number;
	currentPositions: CurrentPosition[];
}
