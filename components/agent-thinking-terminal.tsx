"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { nanoid } from "zod/v4";

interface AgentThinkingTerminalProps {
	reasoning?: string;
}

export function AgentThinkingTerminal({
	reasoning,
}: AgentThinkingTerminalProps) {
	const [displayedLines, setDisplayedLines] = useState<string[]>([]);
	const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
	const [currentCharIndex, setCurrentCharIndex] = useState(0);
	const [showCursor, setShowCursor] = useState(true);
	const [updateCountdown, setUpdateCountdown] = useState(60); // 1 minute in seconds

	// Countdown timer
	useEffect(() => {
		const countdownInterval = setInterval(() => {
			setUpdateCountdown((prev) => {
				if (prev <= 1) {
					// Reset to 1 minute when countdown reaches 0
					return 60;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(countdownInterval);
	}, []);

	// Format countdown to MM:SS
	const formatCountdown = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const thoughts = useMemo(
		() =>
			reasoning
				? [reasoning]
				: [
						"Initializing $1K to $10K Challenge Agent...",
						"Scanning market for high probability setups...",
						"Waiting for AI reasoning data...",
					],
		[reasoning],
	);

	useEffect(() => {
		if (currentThoughtIndex < thoughts.length) {
			const currentThought = thoughts[currentThoughtIndex];
			if (currentCharIndex < currentThought.length) {
				const timeout = setTimeout(() => {
					setDisplayedLines((prev) => {
						const lastLine = prev[prev.length - 1] || "";
						const newLines = [...prev];
						if (newLines.length === 0 || currentCharIndex === 0) {
							newLines.push(currentThought[currentCharIndex]);
						} else {
							newLines[newLines.length - 1] =
								lastLine + currentThought[currentCharIndex];
						}
						return newLines;
					});
					setCurrentCharIndex(currentCharIndex + 1);
				}, 30); // Typing speed
				return () => clearTimeout(timeout);
			} else {
				// Line finished, move to next thought after a short delay
				const timeout = setTimeout(() => {
					setCurrentThoughtIndex(currentThoughtIndex + 1);
					setCurrentCharIndex(0);
					setDisplayedLines((prev) => [...prev, ""]); // Add a new empty line for the next thought
				}, 1000); // Delay before next line
				return () => clearTimeout(timeout);
			}
		} else {
			// All thoughts displayed, restart or stop
			const timeout = setTimeout(() => {
				setCurrentThoughtIndex(0);
				setCurrentCharIndex(0);
				setDisplayedLines([]);
			}, 5000); // Delay before restarting
			return () => clearTimeout(timeout);
		}
	}, [currentThoughtIndex, currentCharIndex, thoughts]);

	// Cursor blinking effect
	useEffect(() => {
		const cursorInterval = setInterval(() => {
			setShowCursor((prev) => !prev);
		}, 500);
		return () => clearInterval(cursorInterval);
	}, []);

	return (
		<Card className="shadow-sm">
			<CardHeader className="pb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-xl font-semibold">
							Agent Strategy
						</CardTitle>
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
						</span>
					</div>
					<div className="text-sm font-medium text-green-500 flex items-center gap-2">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
						</span>
						Updating in {formatCountdown(updateCountdown)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="h-[200px]">
				<div className="font-mono text-sm text-green-500 dark:text-green-400 h-full overflow-y-auto custom-scrollbar">
					{displayedLines.map((line, index) => (
						<div key={`${line}-${nanoid()}`} className="whitespace-pre-wrap">
							{line}
							{index === displayedLines.length - 1 &&
								showCursor &&
								(currentThoughtIndex < thoughts.length ||
									(currentThoughtIndex === thoughts.length &&
										currentCharIndex === 0)) && (
									<span className="animate-pulse">_</span>
								)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
