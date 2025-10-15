import { type ClassValue, clsx } from "clsx";
import type { AgentContext, Token, ToolResult } from "./types";

export const AGENT_ID = "trading-agent-kappa.vercel.app";

export const INTENTS_CONTRACT_ID = "intents.near";
export const TGas = 1000000000000;
export const NEAR_RPC_URL = "https://free.rpc.fastnear.com";
export const BITTE_CHAT_API_URL =
  "https://ai-runtime-446257178793.europe-west1.run.app/chat";

export const MARKET_API_URL = `https://${AGENT_ID}/api/tools/market-overview`;
export const MARKET_SYMBOLS =
  "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,NEARUSDT,ARBUSDT,SUIUSDT,PEPEUSDT,WIFUSDT";
export const BALANCE_UPDATE_DELAY = 20000;

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const MARKET_SYMBOL_MAP = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  SUI: "SUIUSDT",
  ARB: "ARBUSDT",
  wNEAR: "NEARUSDT",
  BNB: "BNBUSDT",
  OP: "OPUSDT",
  AVAX: "AVAXUSDT",
  POL: "POLUSDT",
  ASTER: "ASTERUSDT",
};

export const TOKEN_LIST: Token[] = [
  {
    assetId: "nep141:wrap.near",
    decimals: 24,
    blockchain: "near",
    symbol: "wNEAR",
    contractAddress: "wrap.near",
  },
  {
    assetId: "nep141:eth.omft.near",
    decimals: 18,
    blockchain: "eth",
    symbol: "ETH",
  },
  {
    assetId: "nep141:sui.omft.near",
    decimals: 9,
    blockchain: "sui",
    symbol: "SUI",
  },
  {
    assetId: "nep141:btc.omft.near",
    decimals: 8,
    blockchain: "btc",
    symbol: "BTC",
  },
  {
    assetId: "nep141:sol.omft.near",
    decimals: 9,
    blockchain: "sol",
    symbol: "SOL",
  },
  {
    assetId: "nep141:arb-0x912ce59144191c1204e64559fe8253a0e49e6548.omft.near",
    decimals: 18,
    blockchain: "arb",
    symbol: "ARB",
    contractAddress: "0x912ce59144191c1204e64559fe8253a0e49e6548",
  },
  {
    assetId: "nep141:base.omft.near",
    decimals: 18,
    blockchain: "base",
    symbol: "ETH",
  },
  {
    assetId: "nep245:v2_1.omni.hot.tg:43114_11111111111111111111",
    decimals: 18,
    blockchain: "avax",
    symbol: "AVAX",
  },
  {
    assetId: "nep141:nbtc.bridge.near",
    decimals: 8,
    blockchain: "near",
    symbol: "BTC",
    contractAddress: "nbtc.bridge.near",
  },
  {
    assetId: "nep245:v2_1.omni.hot.tg:10_11111111111111111111",
    decimals: 18,
    blockchain: "op",
    symbol: "ETH",
  },
  {
    assetId:
      "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
    decimals: 6,
    blockchain: "near",
    symbol: "USDC",
    contractAddress:
      "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  },
  {
    assetId: "nep245:v2_1.omni.hot.tg:56_11111111111111111111",
    decimals: 18,
    blockchain: "bsc",
    symbol: "BNB",
  },
  {
    assetId: "nep245:v2_1.omni.hot.tg:56_12zbnsg6xndDVj25QyL82YMPudb",
    decimals: 18,
    blockchain: "bsc",
    symbol: "ASTER",
    contractAddress: "0x000ae314e2a2172a039b26378814c252734f556a",
  },
  {
    assetId: "nep245:v2_1.omni.hot.tg:137_11111111111111111111",
    decimals: 18,
    blockchain: "pol",
    symbol: "POL",
  },
];

export function logTradingAgentData({
  context,
  content,
  pnlUsd,
  quoteResult,
}: {
  context: AgentContext;
  content: string;
  pnlUsd: number;
  quoteResult?: ToolResult | undefined;
}) {
  const {
    totalUsd,
    tradingValue,
    usdcValue,
    pnlPercent,
    currentPositions,
    positionsWithPnl,
  } = context;

  console.log("=== TRADING AGENT DATA ===");
  console.log(
    "TOTAL PORTFOLIO VALUE:",
    totalUsd,
    `(Trading: $${tradingValue.toFixed(2)} + USDC: $${usdcValue.toFixed(2)})`
  );
  console.log("TRADING PNL:", pnlUsd, "PERCENT:", pnlPercent);
  console.log("CURRENT POSITIONS:", currentPositions);
  console.log("POSITIONS WITH PNL:", positionsWithPnl);
  console.log("=== REASONING ===");
  console.log("tradeResult", content, quoteResult);
  console.log("==========================");
}

export const roundToTwo = (value: number) => Math.round(value * 100) / 100;

export const normalizeAsset = (asset: string) =>
  asset === "wNEAR" ? "NEAR" : asset;

