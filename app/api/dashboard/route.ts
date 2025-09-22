import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const MARKET_API_URL = 'https://trading-agent-kappa.vercel.app/api/tools/market-overview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId') || 'trading-agent.near'

  try {
    const snapshotsQuery = `
      SELECT id, snapshot_data, total_usd_value, pnl_usd, pnl_percent, created_at
      FROM portfolio_snapshots 
      WHERE account_id = $1 
      ORDER BY created_at DESC
    `
    const snapshotsResult = await pool.query(snapshotsQuery, [accountId])
    const snapshots = snapshotsResult.rows

    if (snapshots.length === 0) {
      return NextResponse.json({
        totalValue: 0,
        startingValue: 1000,
        accruedYield: 0,
        yieldPercent: 0,
        progress: 0,
        trades: [],
        assetDistribution: [],
        statsChart: [],
        lastReasoning: "No data available",
        requestCount: 0,
        lastUpdate: null
      })
    }

    const latest = snapshots[0]
    const totalValue = latest.total_usd_value
    const startingValue = snapshots[snapshots.length - 1]?.total_usd_value || 1000
    const accruedYield = totalValue - startingValue
    const yieldPercent = ((accruedYield / startingValue) * 100)
    const progress = (totalValue / 10000) * 100

    const assetDistribution = latest.snapshot_data?.positions?.map((pos: any) => ({
      symbol: pos.symbol === 'wNEAR' ? 'NEAR' : pos.symbol,
      value: pos.usd_value,
      percentage: (pos.usd_value / totalValue) * 100,
      change: pos.pnl_percent || 0
    })) || []

    const tradesQuery = `
      SELECT id, 
             timestamp AT TIME ZONE 'UTC' as timestamp,
             account_id, asset, type, quantity, entry_price, amount_usd,
             COALESCE(remaining_quantity, 0) as remaining_quantity,
             COALESCE(realized_pnl, 0) as realized_pnl
      FROM actual_trades 
      WHERE account_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 100
    `
    const tradesResult = await pool.query(tradesQuery, [accountId])
    
    const symbols = 'BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,NEARUSDT,ARBUSDT,SUIUSDT,PEPEUSDT,WIFUSDT'
    let marketPrices = []
    try {
      const marketResponse = await fetch(`${MARKET_API_URL}?symbols=${symbols}`)
      const marketResult = await marketResponse.json()
      marketPrices = marketResult.success ? marketResult.data : []
    } catch (error) {
      console.warn('Failed to fetch market prices:', error)
    }
    
    const trades = tradesResult.rows.map(trade => {
      let currentPrice = 0
      let pnl = 0
      
      if (trade.type === 'SELL') {
        // For SELL trades, use the realized P&L stored in the database
        pnl = Number(trade.realized_pnl || 0)
      } else {
        // For BUY trades, calculate current unrealized P&L using market price
        const marketData = marketPrices.find((p: any) => {
          const marketSymbol = p.symbol.replace('USDT', '')
          return (
            trade.asset === marketSymbol ||
            (trade.asset === 'wNEAR' && marketSymbol === 'NEAR') ||
            (trade.asset === '$WIF' && marketSymbol === 'WIF')
          )
        })
        currentPrice = marketData?.price || 0
        // Only calculate P&L for remaining quantity (open position)
        const remainingQty = Number(trade.remaining_quantity || 0)
        pnl = currentPrice > 0 ? (currentPrice - Number(trade.entry_price)) * remainingQty : 0
      }
      
      return {
        id: trade.id,
        timestamp: trade.timestamp,
        type: trade.type,
        asset: trade.asset === 'wNEAR' ? 'NEAR' : trade.asset,
        quantity: Number(trade.quantity),
        price: Number(trade.entry_price),
        amount: Number(trade.amount_usd),
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Number(trade.entry_price) > 0 ? Math.round((pnl / Number(trade.amount_usd)) * 10000) / 100 : 0,
        portfolioValue: totalValue,
        remaining_quantity: Number(trade.remaining_quantity || 0),
        realized_pnl: Number(trade.realized_pnl || 0)
      }
    })

    // Stats chart data (last 100 data points)
    const statsChart = snapshots
      .slice(0, 100)
      .reverse()
      .map((snap, index) => {
        const date = new Date(snap.created_at);
        const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        return {
          date: timeLabel,
          value: Math.round(snap.total_usd_value * 100) / 100,
          timestamp: snap.created_at,
          pnl: snap.pnl_usd || 0
        }
      })

    // Get latest reasoning from agent
    let lastReasoning = "Agent processing market data...";
    if (latest.snapshot_data?.reasoning) {
      lastReasoning = latest.snapshot_data.reasoning;
    } else if (latest.snapshot_data?.raw_ai_response) {
      // Fallback to parsing raw response
      try {
        const parsed = JSON.parse(latest.snapshot_data.raw_ai_response);
        lastReasoning = parsed.reasoning || parsed.action || "Agent decision recorded";
      } catch {
        lastReasoning = latest.snapshot_data.raw_ai_response.substring(0, 200) + "...";
      }
    }
    
    const requestCount = snapshots.length

    return NextResponse.json({
      totalValue: Math.round(totalValue * 100) / 100,
      startingValue: Math.round(startingValue * 100) / 100,
      accruedYield: Math.round(accruedYield * 100) / 100,
      yieldPercent: Math.round(yieldPercent * 100) / 100,
      progress: Math.round(progress * 100) / 100,
      trades,
      assetDistribution,
      statsChart,
      lastReasoning,
      requestCount,
      lastUpdate: latest.created_at
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
