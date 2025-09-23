# Crypto Trading Dashboard 🚀

An autonomous crypto trading dashboard that uses AI agents to make trading decisions on the NEAR blockchain. The dashboard tracks portfolio performance, visualizes trades, and provides detailed analytics.

## ⚡ One-Click Deploy

Deploy to Vercel in seconds with **automatic database provisioning**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcrypto-dashboard&env=BITTE_API_KEY,ACCOUNT_ID,NEAR_PK,CRON_SECRET&envDescription=Required%20environment%20variables%20for%20the%20trading%20dashboard&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcrypto-dashboard%23environment-setup&project-name=crypto-trading-dashboard&redirect-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fcrypto-dashboard&integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17)

🎯 **Database auto-provisioned** - No manual database setup required!

## 📋 Environment Setup

You'll need these 4 environment variables:

```bash
# Bitte AI API Key - Get from https://bitte.ai
BITTE_API_KEY=your_bitte_api_key_here

# NEAR Account Configuration - Create account at https://wallet.near.org
ACCOUNT_ID=your-account.near
NEAR_PK=your_near_private_key_here

# Cron Job Security - Generate with: openssl rand -base64 32
CRON_SECRET=your_random_secret_string_here

# 🚀 DATABASE_URL is automatically set by Neon integration!
```

### Getting Your Environment Variables

#### 1. **BITTE_API_KEY**
- Sign up at [Bitte AI](https://bitte.ai)
- Create an API key in your dashboard

#### 2. **ACCOUNT_ID** & **NEAR_PK**
- Create a NEAR wallet at [wallet.near.org](https://wallet.near.org)
- Export your private key from wallet settings
- Account ID format: `your-account.near`

#### 3. **CRON_SECRET**
- Generate a random string: `openssl rand -base64 32`
- Used to secure the trading cron endpoint

#### 🎯 **DATABASE_URL** (Automatic!)
- **No setup needed** - Neon database is auto-provisioned during deployment
- **Free tier included** - 1GB storage, 100MB compute
- **Isolated database** - Each deployment gets its own database branch

## 🗄️ Database Setup

### Fully Automatic! 🎯
- **Database provisioned automatically** during Vercel deployment via Neon integration
- **Tables created automatically** on first trade execution
- **Zero manual setup** - everything happens automatically!

### How It Works
1. Deploy button includes Neon integration (`integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17`)
2. Vercel automatically provisions a Neon PostgreSQL database
3. `DATABASE_URL` environment variable is set automatically
4. First cron execution creates the required tables
5. Trading starts immediately!

### Manual Database Setup (Optional)
If you want to use a different database provider, run this SQL:

```sql
-- Trading transactions table
CREATE TABLE actual_trades (
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
CREATE TABLE portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_id VARCHAR(255) NOT NULL,
    snapshot_data JSONB NOT NULL,
    total_usd_value DECIMAL(20, 2) NOT NULL,
    pnl_usd DECIMAL(20, 2) DEFAULT 0,
    pnl_percent DECIMAL(10, 4) DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX idx_actual_trades_account_id ON actual_trades(account_id);
CREATE INDEX idx_actual_trades_timestamp ON actual_trades(timestamp);
CREATE INDEX idx_portfolio_snapshots_account_id ON portfolio_snapshots(account_id);
CREATE INDEX idx_portfolio_snapshots_created_at ON portfolio_snapshots(created_at);
```

## 🚀 How It Works

### Trading Bot Architecture
1. **Cron Job**: Vercel cron runs `/api/trade` every 5 minutes
2. **Auto Setup**: Database tables are created automatically on first run
3. **AI Agent**: Analyzes market conditions and portfolio using Bitte AI
4. **Decision Making**: AI decides whether to buy, sell, or hold positions
5. **Execution**: Trades are executed on NEAR blockchain via smart contracts
6. **Tracking**: All trades and portfolio snapshots are stored in PostgreSQL

### Key Features
- **Autonomous Trading**: AI-powered decision making
- **Real-time Dashboard**: Live portfolio tracking and analytics
- **Trade History**: Complete transaction log with P&L calculations
- **Risk Management**: Position sizing and portfolio allocation
- **Performance Metrics**: Detailed analytics and visualizations

## 🔧 Manual Deployment

If you prefer manual setup:

```bash
# Clone the repository
git clone https://github.com/your-username/crypto-dashboard
cd crypto-dashboard

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database (run the SQL above)

# Run development server
pnpm dev
```

## 📊 API Endpoints

- `GET /api/dashboard?accountId={account}` - Dashboard data
- `GET /api/trade` - Execute trading logic (protected by CRON_SECRET, auto-creates DB)
- `GET /api/trade/{id}` - Individual trade details

## 🔒 Security

- All trading endpoints are protected by the `CRON_SECRET`
- Private keys are encrypted in environment variables
- Database connections use SSL
- No sensitive data is stored in client-side code

## 💰 Costs

- **Vercel**: Free tier covers most usage
- **Database**: Neon free tier (1GB storage)
- **Bitte AI**: Usage-based pricing
- **NEAR**: ~$0.01 per transaction

## 🛠️ Local Development

```bash
# Start development server
pnpm dev

# Access at http://localhost:3000
# API routes available at http://localhost:3000/api/*
```

## 📈 Performance

The dashboard is optimized for:
- Real-time data updates
- Fast query performance with database indexes  
- Responsive design for mobile/desktop
- Efficient caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create an issue for bugs or feature requests
- Join our Discord community
- Check the FAQ section below

## 🙋‍♂️ FAQ

**Q: How much can I expect to make?**
A: Trading involves risk. Past performance doesn't guarantee future results.

**Q: Can I customize the trading strategy?**
A: Yes, modify the AI prompts in `lib/agent-context.ts`.

**Q: Is my private key safe?**
A: Yes, it's stored as an encrypted environment variable and never exposed.

**Q: Can I run multiple trading accounts?**
A: Yes, deploy multiple instances with different ACCOUNT_ID values.
