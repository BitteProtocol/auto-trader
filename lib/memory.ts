import { normalizeAsset, parseAiReasoning, roundToTwo, TOKEN_LIST } from "./utils"
import { Pool } from 'pg'
import { Quote, CurrentPosition, PositionWithPnL } from './types'

const MARKET_API_URL = 'https://trading-agent-kappa.vercel.app/api/tools/market-overview'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

const findMarketPrice = (marketPrices: any[], asset: string) => {
  return marketPrices.find((p: any) => {
    const marketSymbol = p.symbol.replace('USDT', '')
    return (
      asset === marketSymbol ||
      (asset === 'wNEAR' && marketSymbol === 'NEAR')
    )
  })?.price || 0
}

const TRADE_COLUMNS = `
  id, 
  timestamp AT TIME ZONE 'UTC' as timestamp,
  account_id, asset, type, quantity, entry_price, amount_usd,
  COALESCE(remaining_quantity, 0) as remaining_quantity,
  COALESCE(realized_pnl, 0) as realized_pnl
`


  export async function ensureDatabaseSetup() {
    if(process.env.DATABASE_URL) {
      return
    }
  
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'actual_trades'
        );
      `)
      
      if (!tableCheck.rows[0].exists) {
        console.log('Database tables not found, creating...')
        
        const setupSQL = `
          -- Trading transactions table
          CREATE TABLE IF NOT EXISTS actual_trades (
              id SERIAL PRIMARY KEY,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              account_id VARCHAR(255) NOT NULL,
              asset VARCHAR(50) NOT NULL,
              type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
              quantity DECIMAL(20, 8) NOT NULL,
              entry_price DECIMAL(20, 8) NOT NULL,
              amount_usd DECIMAL(20, 2) NOT NULL,
              remaining_quantity DECIMAL(20, 8) DEFAULT 0,
              realized_pnl DECIMAL(20, 2) DEFAULT 0
          );
  
          -- Portfolio snapshots table  
          CREATE TABLE IF NOT EXISTS portfolio_snapshots (
              id SERIAL PRIMARY KEY,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              account_id VARCHAR(255) NOT NULL,
              snapshot_data JSONB NOT NULL,
              total_usd_value DECIMAL(20, 2) NOT NULL,
              pnl_usd DECIMAL(20, 2) DEFAULT 0,
              pnl_percent DECIMAL(10, 4) DEFAULT 0
          );
  
          -- Indexes for better query performance
          CREATE INDEX IF NOT EXISTS idx_actual_trades_account_id ON actual_trades(account_id);
          CREATE INDEX IF NOT EXISTS idx_actual_trades_timestamp ON actual_trades(timestamp DESC);
          CREATE INDEX IF NOT EXISTS idx_actual_trades_asset_type ON actual_trades(asset, type);
          CREATE INDEX IF NOT EXISTS idx_actual_trades_remaining_qty ON actual_trades(remaining_quantity) WHERE remaining_quantity > 0;
  
          CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_account_id ON portfolio_snapshots(account_id);
          CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_created_at ON portfolio_snapshots(created_at DESC);
        `
        
        await pool.query(setupSQL)
        console.log('Database tables created successfully!')
      }
    } finally {
      await pool.end()
    }
  }

export async function storeActualTrade(accountId: string, quote: Quote): Promise<void> {
    const originAsset = TOKEN_LIST.find(t => t.assetId === quote.originAsset)?.symbol || 'UNKNOWN'
    const destAsset = TOKEN_LIST.find(t => t.assetId === quote.destinationAsset)?.symbol || 'UNKNOWN'
    
    const isBuy = originAsset === 'USDC'
    const asset = isBuy ? destAsset : originAsset
    const quantity = isBuy ? parseFloat(quote.amountOutFormatted) : parseFloat(quote.amountInFormatted)
    const exitPrice = isBuy 
      ? parseFloat(quote.amountInFormatted) / parseFloat(quote.amountOutFormatted)
      : parseFloat(quote.amountOutFormatted) / parseFloat(quote.amountInFormatted)
    const amountUsd = isBuy 
      ? parseFloat(quote.amountInFormatted)   // BUY: USDC spent
      : parseFloat(quote.amountOutFormatted)  // SELL: USDC received
  
    try {
      if (isBuy) {
        const query = `
          INSERT INTO actual_trades (account_id, asset, type, quantity, entry_price, amount_usd, remaining_quantity)
          VALUES ($1, $2, $3, $4, $5, $6, $4)
        `
        await pool.query(query, [accountId, asset, 'BUY', quantity, exitPrice, amountUsd])
        console.log(`BUY stored: ${quantity} ${asset} @ $${exitPrice.toFixed(4)} = $${roundToTwo(amountUsd)}`)
      } else {
        // SELL trade: Use FIFO to match against open BUY positions
        await processSellTrade(accountId, asset, quantity, exitPrice, amountUsd)
      }
    } catch (error) {
      console.error('Error storing trade:', error)
    }
  }

  async function processSellTrade(accountId: string, asset: string, sellQuantity: number, exitPrice: number, totalUsdReceived: number): Promise<void> {
    // Get open BUY positions for this asset (FIFO order)
    const openPositionsQuery = `
      SELECT id, quantity, entry_price, remaining_quantity, amount_usd
      FROM actual_trades 
      WHERE account_id = $1 AND asset = $2 AND type = 'BUY' AND remaining_quantity > 0
      ORDER BY timestamp ASC
    `
    const openPositions = await pool.query(openPositionsQuery, [accountId, asset])
    
    let remainingSellQty = sellQuantity
    let totalRealizedPnl = 0
    let weightedAvgEntryPrice = 0
    let totalMatchedQty = 0
    
    for (const position of openPositions.rows) {
      if (remainingSellQty <= 0) break
      
      const availableQty = parseFloat(position.remaining_quantity)
      const matchedQty = Math.min(remainingSellQty, availableQty)
      const entryPrice = parseFloat(position.entry_price)
      
      const realizedPnl = (exitPrice - entryPrice) * matchedQty
      totalRealizedPnl += realizedPnl
      
      weightedAvgEntryPrice += entryPrice * matchedQty
      totalMatchedQty += matchedQty
      
      const newRemainingQty = availableQty - matchedQty
      await pool.query(
        'UPDATE actual_trades SET remaining_quantity = $1 WHERE id = $2',
        [newRemainingQty, position.id]
      )
      
      remainingSellQty -= matchedQty
      
      console.log(`FIFO match: ${matchedQty} ${asset} @ entry $${entryPrice.toFixed(4)} -> exit $${exitPrice.toFixed(4)} = PnL $${roundToTwo(realizedPnl)}`)
    }
    
    if (totalMatchedQty > 0) {
      weightedAvgEntryPrice = weightedAvgEntryPrice / totalMatchedQty
    }
    
    const sellQuery = `
      INSERT INTO actual_trades (account_id, asset, type, quantity, entry_price, amount_usd, remaining_quantity, realized_pnl)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
    `
    await pool.query(sellQuery, [
      accountId, 
      asset, 
      'SELL', 
      sellQuantity, 
      weightedAvgEntryPrice, 
      totalUsdReceived, 
      totalRealizedPnl
    ])
    
    console.log(`SELL stored: ${sellQuantity} ${asset} @ avg entry $${weightedAvgEntryPrice.toFixed(4)} -> exit $${exitPrice.toFixed(4)} | Realized P&L: $${roundToTwo(totalRealizedPnl)}`)
    
    if (remainingSellQty > 0) {
      console.warn(`Warning: Sold ${remainingSellQty} ${asset} without matching buy positions (short selling)`)
    }
  }


  export async function storePortfolioSnapshot(
    accountId: string, 
    positions: PositionWithPnL[], 
    totalUsd: number, 
    previousUsd: number, 
    aiReasoning?: string
  ): Promise<void> {
    const pnlUsd = totalUsd - previousUsd
    const pnlPercent = previousUsd > 0 ? (pnlUsd / previousUsd) * 100 : 0
    const cleanReasoning = aiReasoning
      ?.replace(/```json\n?/g, '')
      .replace(/\n```/g, '')
      .replace(/```\n?/g, '')
      .trim() || null
    
    const snapshotData = { 
      positions, 
      timestamp: new Date().toISOString(),
      reasoning: cleanReasoning,
      raw_ai_response: aiReasoning
    }
    
    try {
      const query = `INSERT INTO portfolio_snapshots (account_id, snapshot_data, total_usd_value, pnl_usd, pnl_percent)
                     VALUES ($1, $2, $3, $4, $5)`
      await pool.query(query, [accountId, JSON.stringify(snapshotData), totalUsd, pnlUsd, pnlPercent])
      
      console.log(`Portfolio snapshot: $${roundToTwo(totalUsd)} (${pnlPercent >= 0 ? '+' : ''}${roundToTwo(pnlPercent)}%) | Reasoning: ${cleanReasoning ? 'Stored' : 'None'}`)
    } catch (error) {
      console.error('Error storing portfolio snapshot:', error)
    }
  }
      
export async function getCurrentPositions(accountId: string): Promise<CurrentPosition[]> {
    try {
      const query = `
        SELECT 
          asset,
          SUM(remaining_quantity) as total_remaining,
          SUM(remaining_quantity * entry_price) / SUM(remaining_quantity) as avg_entry_price,
          SUM(remaining_quantity * entry_price) as total_invested
        FROM actual_trades 
        WHERE account_id = $1 AND type = 'BUY' AND remaining_quantity > 0
        GROUP BY asset
        HAVING SUM(remaining_quantity) > 0.0001
        ORDER BY total_invested DESC
      `
      const result = await pool.query(query, [accountId])
      
      return result.rows.map(row => ({
        asset: row.asset,
        quantity: parseFloat(row.total_remaining),
        avgEntryPrice: parseFloat(row.avg_entry_price || '0'),
        totalInvested: parseFloat(row.total_invested || '0')
      }))
    } catch (error) {
      console.error('Error fetching current positions:', error)
      return []
    }
  }

export async function getPortfolioSnapshots(accountId: string) {
  try {
    const query = `
      SELECT id, snapshot_data, total_usd_value, pnl_usd, pnl_percent, created_at
      FROM portfolio_snapshots 
      WHERE account_id = $1 
      ORDER BY created_at DESC
    `
    const result = await pool.query(query, [accountId])
    return result.rows
  } catch (error) {
    console.error('Error fetching portfolio snapshots:', error)
    return []
  }
}

export async function getTrades(accountId: string, limit = 100) {
  try {
    const query = `SELECT ${TRADE_COLUMNS} FROM actual_trades WHERE account_id = $1 ORDER BY timestamp DESC LIMIT $2`
    const result = await pool.query(query, [accountId, limit])
    return result.rows
  } catch (error) {
    console.error('Error fetching trades:', error)
    return []
  }
}

async function fetchMarketPrices() {
  const symbols = 'BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,NEARUSDT,ARBUSDT,SUIUSDT,PEPEUSDT,WIFUSDT'
  try {
    const response = await fetch(`${MARKET_API_URL}?symbols=${symbols}`)
    const result = await response.json()
    return result.success ? result.data : []
  } catch (error) {
    console.warn('Failed to fetch market prices:', error)
    return []
  }
}

export async function buildDashboardData(accountId: string) {
  const snapshots = await getPortfolioSnapshots(accountId)
  
  if (snapshots.length === 0) {
    return {
      totalValue: 0,
      startingValue: 0,
      goalValue: 0,
      accruedYield: 0,
      yieldPercent: 0,
      trades: [],
      assetDistribution: [],
      statsChart: [],
      lastReasoning: "No data available",
      requestCount: 0,
      lastUpdate: null
    }
  }

  const latest = snapshots[0]
  const earliest = snapshots[snapshots.length - 1]
  const totalValue = latest.total_usd_value
  const startingValue = earliest.total_usd_value
  const goalValue = startingValue * 2
  const accruedYield = totalValue - startingValue
  const yieldPercent = startingValue > 0 ? (accruedYield / startingValue) * 100 : 0

  const assetDistribution = latest.snapshot_data?.positions?.map((pos: any) => ({
    symbol: normalizeAsset(pos.symbol),
    value: pos.usd_value,
    percentage: (pos.usd_value / totalValue) * 100,
    change: pos.pnl_percent || 0
  })) || []

  const marketPrices = await fetchMarketPrices()
  const tradeRows = await getTrades(accountId, 100)
  
  const trades = tradeRows.map(trade => {
    let pnl = 0
    
    if (trade.type === 'SELL') {
      pnl = Number(trade.realized_pnl || 0)
    } else {
      const currentPrice = findMarketPrice(marketPrices, trade.asset)
      const remainingQty = Number(trade.remaining_quantity || 0)
      pnl = currentPrice > 0 ? (currentPrice - Number(trade.entry_price)) * remainingQty : 0
    }
    
    return {
      id: trade.id,
      timestamp: trade.timestamp,
      type: trade.type,
      asset: normalizeAsset(trade.asset),
      quantity: Number(trade.quantity),
      price: Number(trade.entry_price),
      amount: Number(trade.amount_usd),
      pnl: roundToTwo(pnl),
      pnlPercent: Number(trade.entry_price) > 0 ? roundToTwo((pnl / Number(trade.amount_usd)) * 100) : 0,
      portfolioValue: totalValue,
      remaining_quantity: Number(trade.remaining_quantity || 0),
      realized_pnl: Number(trade.realized_pnl || 0)
    }
  })

  const statsChart = snapshots
    .slice(0, 500)
    .reverse()
    .map((snap) => {
      const date = new Date(snap.created_at)
      const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      
      return {
        date: timeLabel,
        value: roundToTwo(snap.total_usd_value),
        timestamp: snap.created_at,
        pnl: snap.pnl_usd || 0
      }
    })

  const lastReasoning = parseAiReasoning(latest.snapshot_data)

  return {
    totalValue: roundToTwo(totalValue),
    startingValue: roundToTwo(startingValue),
    goalValue: roundToTwo(goalValue),
    accruedYield: roundToTwo(accruedYield),
    yieldPercent: roundToTwo(yieldPercent),
    trades,
    assetDistribution,
    statsChart,
    lastReasoning,
    requestCount: snapshots.length,
    lastUpdate: latest.created_at
  }
}

export async function getTradeDetail(tradeId: string) {
  try {
    const tradeQuery = `SELECT ${TRADE_COLUMNS} FROM actual_trades WHERE id = $1`
    const tradeResult = await pool.query(tradeQuery, [tradeId])

    if (tradeResult.rows.length === 0) {
      return null
    }

    const trade = tradeResult.rows[0]
    const tradeTimestamp = new Date(trade.timestamp)

    const snapshotQuery = `
      SELECT id, snapshot_data, total_usd_value, created_at
      FROM portfolio_snapshots 
      WHERE account_id = $1 
        AND created_at BETWEEN $2 AND $3
      ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - $2::timestamp)))
      LIMIT 1
    `
    
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
      reasoning = parseAiReasoning(snapshot.snapshot_data, "No reasoning data available for this trade.")

      if (snapshot.snapshot_data?.market_analysis) {
        marketConditions = snapshot.snapshot_data.market_analysis
      }
    }

    const pnl = trade.type === 'SELL' ? Number(trade.realized_pnl || 0) : 0

    return {
      id: trade.id,
      timestamp: trade.timestamp,
      asset: normalizeAsset(trade.asset),
      type: trade.type,
      quantity: Number(trade.quantity),
      price: Number(trade.entry_price),
      amount: Number(trade.amount_usd),
      pnl: roundToTwo(pnl),
      reasoning,
      marketConditions: marketConditions || undefined,
      portfolioValue: roundToTwo(portfolioValue)
    }
  } catch (error) {
    console.error('Error fetching trade detail:', error)
    return null
  }
}