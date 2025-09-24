"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ArrowLeft,
	Clock,
	TrendingUp,
	TrendingDown,
	DollarSign,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/time-utils";

interface TradeDetail {
	id: string;
	timestamp: string;
	asset: string;
	type: string;
	quantity: number;
	price: number;
	amount: number;
	pnl: number;
	reasoning: string;
	marketConditions?: string;
	portfolioValue: number;
}

const tokensUrl = "https://storage.googleapis.com/bitte-public/intents/tokens";
const chainsUrl = "https://storage.googleapis.com/bitte-public/intents/chains";

const TOKEN_ICONS: Record<string, string> = {
	BTC: `${tokensUrl}/btc_token.svg`,
	ETH: `${tokensUrl}/eth_token.svg`,
	NEAR: `${chainsUrl}/near.svg`,
	WNEAR: `${chainsUrl}/near.svg`,
	USDC: `${tokensUrl}/usdc_token.svg`,
	USDT: `${tokensUrl}/usdt_token.svg`,
	SOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
	ARB: "https://s2.coinmarketcap.com/static/img/coins/128x128/11841.png",
	DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
	PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
	SUI: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png",
	TRUMP: `https://assets.coingecko.com/coins/images/53746/standard/trump.png?1737171561`,
	$WIF: "https://assets.coingecko.com/coins/images/33566/standard/dogwifhat.jpg?1702499428",
};

export default function TradeDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [trade, setTrade] = useState<TradeDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTradeDetail = async (tradeId: string) => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(`/api/dashboard/${tradeId}`);

				if (!response.ok) {
					throw new Error("Failed to fetch trade details");
				}

				const result = await response.json();
				setTrade(result);
			} catch (error) {
				console.error("Error fetching trade detail:", error);
				setError("Failed to load trade details");
			} finally {
				setLoading(false);
			}
		};
		if (params.id) {
			fetchTradeDetail(params.id as string);
		}
	}, [params.id]);

	if (loading) {
		return (
			<div className="min-h-screen bg-neutral-950 text-foreground p-4 md:p-8 flex items-center justify-center">
				<div className="text-lg">Loading trade details...</div>
			</div>
		);
	}

	if (error || !trade) {
		return (
			<div className="min-h-screen bg-neutral-950 text-foreground p-4 md:p-8 flex items-center justify-center">
				<div className="text-center">
					<div className="text-lg text-red-500 mb-4">
						{error || "Trade not found"}
					</div>
					<Button onClick={() => router.push("/")} variant="outline">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Dashboard
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-neutral-950 text-foreground p-4 md:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Button onClick={() => router.push("/")} variant="outline" size="sm">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
					<h1 className="text-2xl md:text-3xl font-bold">Trade Details</h1>
				</div>

				{/* Trade Overview Card */}
				<Card className="shadow-lg">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-3">
								{TOKEN_ICONS[trade.asset] && (
									<img
										src={TOKEN_ICONS[trade.asset]}
										alt={trade.asset}
										className="w-8 h-8 rounded-full"
									/>
								)}
								<span>{trade.asset}</span>
								<span
									className={`px-3 py-1 rounded-full text-sm font-semibold ${
										trade.type === "BUY"
											? "bg-green-500/20 text-green-500"
											: "bg-red-500/20 text-red-500"
									}`}
								>
									{trade.type}
								</span>
							</CardTitle>
							<div className="flex items-center gap-2 text-muted-foreground">
								<Clock className="w-4 h-4" />
								<span className="text-sm">
									{formatRelativeTime(trade.timestamp)}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">Quantity</div>
								<div className="text-xl font-semibold">
									{Number(trade.quantity).toFixed(6)}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">Price</div>
								<div className="text-xl font-semibold">
									$
									{Number(trade.price).toFixed(
										Number(trade.price) < 0.01 ? 8 : 2,
									)}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">Amount</div>
								<div className="text-xl font-semibold flex items-center gap-1">
									<DollarSign className="w-5 h-5" />
									{Number(trade.amount).toFixed(2)}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">P&L</div>
								<div
									className={`text-xl font-semibold flex items-center gap-1 ${
										trade.pnl >= 0 ? "text-green-500" : "text-red-500"
									}`}
								>
									{trade.pnl >= 0 ? (
										<TrendingUp className="w-5 h-5" />
									) : (
										<TrendingDown className="w-5 h-5" />
									)}
									{trade.pnl >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* AI Reasoning Card */}
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
							AI Trading Reasoning
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="prose prose-invert max-w-none">
							<div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/20 rounded-lg">
								{trade.reasoning || "No reasoning available for this trade."}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Market Context Card */}
				{trade.marketConditions && (
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>Market Context</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-sm leading-relaxed p-4 bg-muted/10 rounded-lg">
								{trade.marketConditions}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Portfolio Context */}
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle>Portfolio Context</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">
									Portfolio Value at Time
								</div>
								<div className="text-lg font-semibold">
									${Number(trade.portfolioValue).toFixed(2)}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">
									Trade Impact
								</div>
								<div className="text-lg font-semibold">
									{(
										(Number(trade.amount) / Number(trade.portfolioValue)) *
										100
									).toFixed(2)}
									% of portfolio
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
