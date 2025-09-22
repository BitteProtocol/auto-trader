import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tradeId } = await params

  try {
    // Get the specific trade details
    const tradeQuery = `
      SELECT id, 
             timestamp AT TIME ZONE 'UTC' as timestamp,
             account_id, asset, type, quantity, entry_price, amount_usd,
             COALESCE(remaining_quantity, 0) as remaining_quantity,
             COALESCE(realized_pnl, 0) as realized_pnl
      FROM actual_trades 
      WHERE id = $1
    `
    const tradeResult = await pool.query(tradeQuery, [tradeId])

    if (tradeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      )
    }

    const trade = tradeResult.rows[0]
    const tradeTimestamp = new Date(trade.timestamp)

    // Find the closest snapshot around the time of the trade
    // Look for snapshots within 1 hour of the trade
    const snapshotQuery = `
      SELECT id, snapshot_data, total_usd_value, created_at
      FROM portfolio_snapshots 
      WHERE account_id = $1 
        AND created_at BETWEEN $2 AND $3
      ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - $2::timestamp)))
      LIMIT 1
    `
    
    const oneHourBefore = new Date(tradeTimestamp.getTime() - 60 * 60 * 1000)
    const oneHourAfter = new Date(tradeTimestamp.getTime() + 60 * 60 * 1000)
    
    const snapshotResult = await pool.query(snapshotQuery, [
      trade.account_id,
      tradeTimestamp,
      oneHourAfter
    ])

    let reasoning = "No reasoning data available for this trade."
    let marketConditions = ""
    let portfolioValue = 0

    if (snapshotResult.rows.length > 0) {
      const snapshot = snapshotResult.rows[0]
      portfolioValue = snapshot.total_usd_value || 0

      if (snapshot.snapshot_data?.reasoning) {
        reasoning = snapshot.snapshot_data.reasoning
      } else if (snapshot.snapshot_data?.raw_ai_response) {
        // Try to parse the raw AI response
        try {
          const parsed = JSON.parse(snapshot.snapshot_data.raw_ai_response)
          reasoning = parsed.reasoning || parsed.action || "Agent decision recorded"
        } catch {
          reasoning = snapshot.snapshot_data.raw_ai_response.substring(0, 500) + "..."
        }
      }

      // Extract market conditions if available
      if (snapshot.snapshot_data?.market_analysis) {
        marketConditions = snapshot.snapshot_data.market_analysis
      }
    }

    // Calculate P&L based on trade type
    let pnl = 0
    if (trade.type === 'SELL') {
      pnl = Number(trade.realized_pnl || 0)
    } else {
      // For BUY trades, we'd need current market price to calculate unrealized P&L
      // For now, just use 0 or calculate based on remaining quantity
      pnl = 0
    }

    const tradeDetail = {
      id: trade.id,
      timestamp: trade.timestamp,
      asset: trade.asset === 'wNEAR' ? 'NEAR' : trade.asset,
      type: trade.type,
      quantity: Number(trade.quantity),
      price: Number(trade.entry_price),
      amount: Number(trade.amount_usd),
      pnl: Math.round(pnl * 100) / 100,
      reasoning: reasoning,
      marketConditions: marketConditions || undefined,
      portfolioValue: Math.round(portfolioValue * 100) / 100
    }

    return NextResponse.json(tradeDetail)

  } catch (error) {
    console.error('Trade detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trade details' },
      { status: 500 }
    )
  }
}
