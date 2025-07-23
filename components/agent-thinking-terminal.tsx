"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

const thoughts = [
  "Initializing AI agent...",
  "Connecting to market data streams...",
  "Analyzing historical price trends for BTC, ETH, ADA...",
  "Evaluating current volatility and liquidity metrics...",
  "Running predictive models for short-term movements...",
  "Identifying potential entry points based on strategy 'AlphaWave'...",
  "Monitoring real-time order book depth...",
  "Detecting significant whale movements...",
  "Calculating optimal trade size and risk parameters...",
  "Executing trade: BUY 0.05 BTC @ $29,500.00...",
  "Trade executed successfully. Monitoring PnL...",
  "Adjusting stop-loss and take-profit levels...",
  "Agent is now actively trading. Standby for next action...",
  "Scanning for news sentiment impacting crypto markets...",
  "Evaluating portfolio rebalancing opportunities...",
  "Agent thinking complete. Awaiting next cycle...",
]

export function AgentThinkingTerminal() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentThoughtIndex < thoughts.length) {
      const currentThought = thoughts[currentThoughtIndex]
      if (currentCharIndex < currentThought.length) {
        const timeout = setTimeout(() => {
          setDisplayedLines((prev) => {
            const lastLine = prev[prev.length - 1] || ""
            const newLines = [...prev]
            if (newLines.length === 0 || currentCharIndex === 0) {
              newLines.push(currentThought[currentCharIndex])
            } else {
              newLines[newLines.length - 1] = lastLine + currentThought[currentCharIndex]
            }
            return newLines
          })
          setCurrentCharIndex(currentCharIndex + 1)
        }, 30) // Typing speed
        return () => clearTimeout(timeout)
      } else {
        // Line finished, move to next thought after a short delay
        const timeout = setTimeout(() => {
          setCurrentThoughtIndex(currentThoughtIndex + 1)
          setCurrentCharIndex(0)
          setDisplayedLines((prev) => [...prev, ""]) // Add a new empty line for the next thought
        }, 1000) // Delay before next line
        return () => clearTimeout(timeout)
      }
    } else {
      // All thoughts displayed, restart or stop
      const timeout = setTimeout(() => {
        setCurrentThoughtIndex(0)
        setCurrentCharIndex(0)
        setDisplayedLines([])
      }, 5000) // Delay before restarting
      return () => clearTimeout(timeout)
    }
  }, [currentThoughtIndex, currentCharIndex])

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <Card className="w-full font-mono text-green-400">
        <CardTitle className="text-sm pt-4 px-4 font-normal text-muted-foreground">Agent Strategy...</CardTitle>
      <CardContent className="p-6 text-sm h-[200px] overflow-y-auto custom-scrollbar">
        {" "}
        {/* Adjusted height to 200px */}
        {displayedLines.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {line}
            {index === displayedLines.length - 1 &&
              showCursor &&
              (currentThoughtIndex < thoughts.length ||
                (currentThoughtIndex === thoughts.length && currentCharIndex === 0)) && (
                <span className="animate-pulse">_</span>
              )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
