import { NextRequest, NextResponse } from 'next/server'
import { callAgent } from '@bitte-ai/agent-sdk'
import { Quote, ToolResult } from '@/lib/types'
import { BALANCE_UPDATE_DELAY, logTradingAgentData } from '@/lib/utils'
import { ensureDatabaseSetup, storeActualTrade, storePortfolioSnapshot } from '@/lib/memory'
import { buildTransactionPayload, initializeNearAccount } from '@/lib/near'
import { buildAgentContext } from '@/lib/agent-context'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = process.env.ACCOUNT_ID
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }
    
    await ensureDatabaseSetup()
    
    const agentId = 'trading-agent-kappa.vercel.app'

    const account = await initializeNearAccount(accountId)
    
    const context = await buildAgentContext(accountId, account)
    
    const { content, toolResults } = await callAgent(accountId, context.systemPrompt, agentId)
    
    const quoteResult = (toolResults as ToolResult[]).find(callResult => 
      callResult.result.data.data.quote
    )
    const quote = quoteResult?.result.data.data.quote
      
    logTradingAgentData({
      totalUsd: context.totalUsd,
      tradingValue: context.tradingValue,
      usdcValue: context.usdcValue,
      pnlUsd: context.totalPnl,
      pnlPercent: context.pnlPercent,
      currentPositions: context.currentPositions,
      positionsWithPnl: context.positionsWithPnl,
      content,
      quote: quoteResult
    })

    if (quote) {
      const tx = await account.signAndSendTransaction(buildTransactionPayload(quote))
      console.log('Trade executed:', tx.transaction.hash)
      await new Promise(resolve => setTimeout(resolve, BALANCE_UPDATE_DELAY))
      await storeActualTrade(accountId, quote)
      
      const updatedContext = await buildAgentContext(accountId, account)
      
      await storePortfolioSnapshot(accountId, updatedContext.positionsWithPnl, updatedContext.totalUsd, context.totalUsd, content)
    } 
    else {
      storePortfolioSnapshot(accountId, context.positionsWithPnl, context.totalUsd, context.totalUsd, content)
    }
    return NextResponse.json({ content })
    
  } catch (error) {
    console.error('Error in trading endpoint:', error)
    return NextResponse.json({ error: 'Failed to process trading request' }, { status: 500 })
  }
}
