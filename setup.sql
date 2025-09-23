-- Crypto Trading Dashboard Database Schema
-- Run this SQL in your PostgreSQL database to set up the required tables

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

-- Comments for documentation
COMMENT ON TABLE actual_trades IS 'Stores all trading transactions with FIFO position tracking';
COMMENT ON TABLE portfolio_snapshots IS 'Stores portfolio states and AI reasoning at each trading decision';

COMMENT ON COLUMN actual_trades.remaining_quantity IS 'Tracks remaining position size for FIFO matching on sells';
COMMENT ON COLUMN actual_trades.realized_pnl IS 'P&L realized when position is closed (SELL trades only)';
COMMENT ON COLUMN portfolio_snapshots.snapshot_data IS 'JSON containing positions, AI reasoning, and metadata';

