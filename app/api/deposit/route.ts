import { NextRequest, NextResponse } from 'next/server'
import { BALANCE_UPDATE_DELAY } from '@/lib/utils'
import { initializeNearAccount, depositUSDC, getUSDCBalance } from '@/lib/near'

export async function GET(request: NextRequest) {
  try {
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined
    const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is not configured' }, { status: 500 })
    }

    const depositAmount = amount || 10
    
    const account = await initializeNearAccount(accountId)
    
    const usdcBalance = await getUSDCBalance(account)
    const usdcBalanceDecimal = Number(usdcBalance) / 1_000_000

    if (usdcBalanceDecimal < depositAmount) {
      return NextResponse.json({ 
        error: `Insufficient USDC balance (required: $${depositAmount}, available: $${usdcBalanceDecimal.toFixed(2)})` 
      }, { status: 400 })
    }

    const amountToDeposit = BigInt(depositAmount * 1_000_000)
    
    const tx = await depositUSDC(account, amountToDeposit)
    
    await new Promise(resolve => setTimeout(resolve, BALANCE_UPDATE_DELAY))

    return NextResponse.json({ 
      message: `Successfully deposited $${depositAmount} USDC`,
      transactionHash: tx.transaction.hash,
      amount: depositAmount 
    })
    
  } catch (error) {
    console.error('Error in deposit endpoint:', error)
    return NextResponse.json({ error: 'Failed to process deposit request' }, { status: 500 })
  }
}
