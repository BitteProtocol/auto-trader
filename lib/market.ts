import type { Account } from "near-api-js";
import { getTokenBalance } from "./near";
import type {
  CurrentPosition,
  MarketPrice,
  PositionWithPnL,
  TokenBalance,
} from "./types";
import {
  MARKET_API_URL,
  MARKET_SYMBOL_MAP,
  MARKET_SYMBOLS,
  TOKEN_LIST,
} from "./utils";

export function calculatePortfolioValue(
  portfolio: TokenBalance[],
  marketPrices: MarketPrice[],
): {
  positions: {
    symbol: string;
    balance: string;
    price: number;
    usd_value: number;
  }[];
  totalUsd: number;
} {
  const positions = portfolio.map((token) => {
    const price =
      token.symbol === "USDC" ? 1 : getTokenPrice(token.symbol, marketPrices);
    const usdValue = parseFloat(token.balanceFormatted) * price;

    return {
      symbol: token.symbol,
      balance: token.balanceFormatted,
      price,
      usd_value: usdValue,
    };
  });

  const totalUsd = positions.reduce((sum, pos) => sum + pos.usd_value, 0);
  return { positions, totalUsd };
}

export function calculatePositionsPnL(
  currentPositions: CurrentPosition[],
  marketPrices: MarketPrice[],
  portfolio: TokenBalance[],
): { positionsWithPnl: PositionWithPnL[]; totalUsd: number; totalPnl: number } {
  const positionsWithPnl = currentPositions.map((position) => {
    const currentPrice = getTokenPrice(position.asset, marketPrices);
    const currentValue = position.quantity * currentPrice;
    const pnlUsd = currentValue - position.totalInvested;
    const pnlPercent =
      position.totalInvested > 0 ? (pnlUsd / position.totalInvested) * 100 : 0;

    const portfolioToken = portfolio.find((p) => p.symbol === position.asset);
    const rawBalance = portfolioToken?.balance || "0";

    return {
      symbol: position.asset,
      balance: position.quantity.toFixed(6),
      rawBalance,
      quantity: position.quantity,
      avgEntryPrice: position.avgEntryPrice,
      currentPrice,
      totalInvested: position.totalInvested,
      currentValue,
      price: currentPrice,
      usd_value: currentValue,
      pnl_usd: pnlUsd,
      pnl_percent: pnlPercent,
    };
  });

  const totalUsd = positionsWithPnl.reduce(
    (sum, pos) => sum + pos.currentValue,
    0,
  );
  const totalPnl = positionsWithPnl.reduce((sum, pos) => sum + pos.pnl_usd, 0);

  return { positionsWithPnl, totalUsd, totalPnl };
}

function getTokenPrice(symbol: string, marketPrices: MarketPrice[]): number {
  const marketSymbol =
    MARKET_SYMBOL_MAP[symbol as keyof typeof MARKET_SYMBOL_MAP];
  if (!marketSymbol) return 0;

  const marketData = marketPrices.find((p) => p.symbol === marketSymbol);
  return marketData?.price || 0;
}

export async function fetchMarketPrices(): Promise<{
  marketPrices: MarketPrice[];
  marketOverviewData: string;
}> {
  try {
    const response = await fetch(`${MARKET_API_URL}?symbols=${MARKET_SYMBOLS}`);
    const result = await response.json();

    if (result.success) {
      return {
        marketPrices: result.data,
        marketOverviewData: JSON.stringify(result.data, null, 2),
      };
    }
  } catch (error) {
    console.warn("Failed to fetch market overview:", error);
  }

  return {
    marketPrices: [],
    marketOverviewData: "Market overview unavailable",
  };
}

export async function fetchPortfolioBalances(
  account: Account,
): Promise<TokenBalance[]> {
  const balancePromises = TOKEN_LIST.map(async (token) => {
    try {
      const balance = await getTokenBalance(account, token.assetId);
      if (balance === BigInt(0)) return null;

      return {
        assetId: token.assetId,
        symbol: token.symbol,
        balance: balance.toString(),
        decimals: token.decimals,
        balanceFormatted: (Number(balance) / 10 ** token.decimals).toFixed(6),
      };
    } catch (error) {
      console.warn(`Failed to process ${token.symbol}:`, error);
      return null;
    }
  });

  const responses = await Promise.all(balancePromises);
  return responses.filter((token): token is TokenBalance => token !== null);
}
