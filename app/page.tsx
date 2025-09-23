'use client'

import { useState, useEffect, useRef } from 'react'
import { StatsChart } from "@/components/stats-chart"
import { TradeLogTable } from "@/components/trade-log-table"
import { AssetDistributionChart } from "@/components/asset-distribution-chart"
import { AgentThinkingTerminal } from "@/components/agent-thinking-terminal"
import { RealizedPnLTable } from "@/components/realized-pnl-table"

interface DashboardData {
  totalValue: number
  startingValue: number
  goalValue: number
  accruedYield: number
  yieldPercent: number
  trades: any[]
  assetDistribution: any[]
  statsChart: any[]
  lastReasoning: string
  requestCount: number
  lastUpdate: string | null
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeToUpdate, setTimeToUpdate] = useState<string>('')

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard?accountId=trading-agent.near')
        const result = await response.json()
        setData(result)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Check for new data every minute
    return () => clearInterval(interval)
  }, [])

  // Countdown display effect
  useEffect(() => {
    if (!data?.lastUpdate) {
      setTimeToUpdate('')
      return
    }

    const updateCountdown = () => {
      const lastUpdate = new Date(data.lastUpdate!)
      const nextExpected = new Date(lastUpdate.getTime() + 30 * 60 * 1000)
      const now = new Date()
      const diff = nextExpected.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeToUpdate('')
      } else {
        const minutes = Math.floor(diff / (1000 * 60))
        if (minutes >= 5) {
          setTimeToUpdate(`${minutes}m`)
        } else {
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setTimeToUpdate(`${minutes}:${seconds.toString().padStart(2, '0')}`)
        }
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 30000) // Update display every 30 seconds
    return () => clearInterval(timer)
  }, [data?.lastUpdate])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-foreground p-8 flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-foreground p-4 md:p-8 flex flex-col gap-4 md:gap-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-2">
        <div className="flex flex-col space-y-3 lg:min-w-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">trading-agent.near</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
              </div>
              {timeToUpdate && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Next: {timeToUpdate}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-semibold text-muted-foreground">
            ${(data.totalValue || 0).toLocaleString()} / ${(data.goalValue || 0).toLocaleString()}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 flex-1">
          <div className="space-y-3 pt-2">
            <div className={`text-lg md:text-xl font-semibold flex items-center gap-2 ${(data.accruedYield || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Accrued Yield: {(data.accruedYield || 0) >= 0 ? '+' : ''}${(data.accruedYield || 0).toLocaleString()} ({(data.accruedYield || 0) >= 0 ? '+' : ''}{(data.yieldPercent || 0).toFixed(1)}%)
            </div>
            <div className="w-full max-w-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-green-500">{(data.goalValue > 0 ? ((data.totalValue || 0) / data.goalValue * 100).toFixed(1) : '0.0')}%</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700 ease-out relative"
                  style={{ width: `${Math.min(data.goalValue > 0 ? ((data.totalValue || 0) / data.goalValue * 100) : 0, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>Started: ${(data.startingValue || 0).toLocaleString()}</span>
                <span>Goal: ${(data.goalValue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trade Log Section */}
      <div className="flex-1 mb-6">
        <TradeLogTable trades={data.trades} />
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatsChart data={data.statsChart} totalValue={data.totalValue} />
        </div>
        <AssetDistributionChart assets={data.assetDistribution} />
      </div>
      
      {/* Bottom Section: Realized P&L and Agent Terminal */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <RealizedPnLTable trades={data.trades} />
        <AgentThinkingTerminal reasoning={data.lastReasoning} />
      </div>
    </div>
  )
}
