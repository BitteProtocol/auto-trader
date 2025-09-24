# Auto Trader Agent 

An autonomous crypto trading agent that references market decisions and then uses near intents to execute trades across many chains via a single near account

![Auto Trader Agent Demo](https://i.imgur.com/rMkqcji.png)

## ⚡ One-Click Deploy

Deploy to Vercel instantly, by clicking this button you will be taken to a page where you can fill in the required environment variables and then click deploy, this will also automatically setup the database for you

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?&demo-title=auto-trader&demo-url=https%3A%2F%2Fvercel-marketplace-neon.vercel.app%2F&from=templates&products=%255B%257B%2522type%2522%253A%2522integration%2522%252C%2522protocol%2522%253A%2522storage%2522%252C%2522productSlug%2522%253A%2522neon%2522%252C%2522integrationSlug%2522%253A%2522neon%2522%257D%255D&project-name=auto-trader&repository-name=auto-trader&repository-url=https%3A%2F%2Fgithub.com%2FSurgeCode%2Fauto-trader&skippable-integrations=1&teamSlug=surgecodes-projects&env=BITTE_API_KEY,NEXT_PUBLIC_ACCOUNT_ID,NEAR_PK,CRON_SECRET&envDescription=Required%20environment%20variables%20for%20the%20trading%20dashboard&envLink=https%3A%2F%2Fgithub.com%2FSurgeCode%2Fauto-trader%23environment-setup)

**No manual DB setup. Just click and go.**

## 📋 Environment Setup

You'll need these 4 environment variables:

```bash

BITTE_API_KEY=your_bitte_api_key_here # Bitte AI API Key - Get from https://bitte.ai
NEXT_PUBLIC_ACCOUNT_ID=your-account.near # Create a near account https://wallet.intear.tech/
NEAR_PK=your_near_private_key_here # Export your private key from wallet settings
CRON_SECRET=your_random_secret_string_here # Create a random secret so that only you can call your agent
```

## 🤖 Trading Workflow

### Initial Setup
1. **Fund Wallet**: Add USDC to your NEAR intents wallet
2. **First Run**: Database and tables are automatically created on initial API call

### Automated Trading Cycle
1. **Analysis**: Agent analyzes current portfolio and market conditions
2. **Decision**: AI agent determines optimal trading action using Bitte AI
3. **Execution**: 
   - **Trade**: Executes buy/sell orders via NEAR intents wallet
   - **Hold**: Waits for better market opportunities
4. **Recording**: All trades and decisions are stored with full context
5. **Snapshot**: Portfolio state is captured for performance tracking

### Triggering Trades
- **Manual**: `GET /api/trade` endpoint (protected by `CRON_SECRET`)
- **Automated**: Scheduled via Vercel cron (every 45 minutes)

## 📊 Dashboard Features

### Real-Time Portfolio Tracking
- **Current Value**: Live portfolio valuation with 2x goal tracking
- **Performance Metrics**: Accrued yield, percentage gains, progress visualization
- **Asset Distribution**: Interactive pie chart showing current holdings

### Trading Intelligence
- **Trade Log**: Complete history with entry/exit prices, quantities, and P&L
- **Agent Reasoning**: AI decision-making process for each trade
- **Market Analysis**: Context behind trading decisions
- **Realized P&L**: FIFO-based profit/loss calculations

### Analytics & Insights  
- **Performance Chart**: Portfolio value over time with trend analysis
- **Live Updates**: Auto-refreshing data every 60 seconds
- **Trade Details**: Drill-down into individual trade reasoning and context

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Status**: Live trading indicator with countdown to next execution
- **Error Handling**: Graceful fallbacks for network/data issues