import { NextRequest, NextResponse } from 'next/server'
import { BALANCE_UPDATE_DELAY, logTradingAgentData } from '@/lib/utils'
import { storeTrade, storePortfolioSnapshot } from '@/lib/api-helpers'
import { buildTransactionPayload, initializeNearAccount } from '@/lib/near'
import { buildAgentContext } from '@/lib/agent-context'
import { callAgent } from '@bitte-ai/agent-sdk'
import { ToolResult } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }
    
    const agentId = 'trading-agent-kappa.vercel.app'

    const account = await initializeNearAccount(accountId)
    
    const context = await buildAgentContext(accountId, account)
    
    const { content, toolResults } = await callAgent(accountId, context.systemPrompt, agentId)
    
    const quoteResult = (toolResults as ToolResult[]).find(callResult => 
      callResult.result?.data?.data?.quote
    )
    const quote = quoteResult?.result?.data?.data?.quote
      
    logTradingAgentData({
      context,
      content,
      pnlUsd: context.totalPnl,
      quoteResult
    })

    if (quote) {
      const tx = await account.signAndSendTransaction(buildTransactionPayload(quote))
      console.log('Trade executed:', tx.transaction.hash)
      await new Promise(resolve => setTimeout(resolve, BALANCE_UPDATE_DELAY))
      await storeTrade(quote)
      
      const updatedContext = await buildAgentContext(accountId, account)
      
      await storePortfolioSnapshot(updatedContext.positionsWithPnl, updatedContext.totalUsd, context.totalUsd, content)
    } 
    else {
      await storePortfolioSnapshot(context.positionsWithPnl, context.totalUsd, context.totalUsd, content)
    }
    return NextResponse.json({ content })
    
  } catch (error) {
    console.error('Error in trading endpoint:', error)
    return NextResponse.json({ error: 'Failed to process trading request' }, { status: 500 })
  }
}
