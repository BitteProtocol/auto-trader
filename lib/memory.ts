import { TOKEN_LIST } from "./utils"
import { Pool } from 'pg'
import { Quote, CurrentPosition, PositionWithPnL } from './types'


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })


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
        console.log(`BUY stored: ${quantity} ${asset} @ $${exitPrice.toFixed(4)} = $${amountUsd}`)
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
    
    // Match sell quantity against open buy positions (FIFO)
    for (const position of openPositions.rows) {
      if (remainingSellQty <= 0) break
      
      const availableQty = parseFloat(position.remaining_quantity)
      const matchedQty = Math.min(remainingSellQty, availableQty)
      const entryPrice = parseFloat(position.entry_price)
      
      // Calculate realized P&L for this portion
      const realizedPnl = (exitPrice - entryPrice) * matchedQty
      totalRealizedPnl += realizedPnl
      
      // Track weighted average entry price
      weightedAvgEntryPrice += entryPrice * matchedQty
      totalMatchedQty += matchedQty
      
      // Update remaining quantity on the buy position
      const newRemainingQty = availableQty - matchedQty
      await pool.query(
        'UPDATE actual_trades SET remaining_quantity = $1 WHERE id = $2',
        [newRemainingQty, position.id]
      )
      
      remainingSellQty -= matchedQty
      
      console.log(`FIFO match: ${matchedQty} ${asset} @ entry $${entryPrice.toFixed(4)} -> exit $${exitPrice.toFixed(4)} = PnL $${realizedPnl.toFixed(2)}`)
    }
    
    if (totalMatchedQty > 0) {
      weightedAvgEntryPrice = weightedAvgEntryPrice / totalMatchedQty
    }
    
    // Store the SELL trade with proper entry price and realized P&L
    const sellQuery = `
      INSERT INTO actual_trades (account_id, asset, type, quantity, entry_price, amount_usd, remaining_quantity, realized_pnl)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
    `
    await pool.query(sellQuery, [
      accountId, 
      asset, 
      'SELL', 
      sellQuantity, 
      weightedAvgEntryPrice, // Store the weighted average entry price of matched positions
      totalUsdReceived, 
      totalRealizedPnl
    ])
    
    console.log(`SELL stored: ${sellQuantity} ${asset} @ avg entry $${weightedAvgEntryPrice.toFixed(4)} -> exit $${exitPrice.toFixed(4)} | Realized P&L: $${totalRealizedPnl.toFixed(2)}`)
    
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
      
      console.log(`Portfolio snapshot: $${totalUsd.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%) | Reasoning: ${cleanReasoning ? 'Stored' : 'None'}`)
    } catch (error) {
      console.error('Error storing portfolio snapshot:', error)
    }
  }

  // Database Service Functions
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