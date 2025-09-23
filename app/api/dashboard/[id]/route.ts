import { NextRequest, NextResponse } from 'next/server'
import { getTradeDetail } from '@/lib/memory'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tradeId } = await params

  try {
    const tradeDetail = await getTradeDetail(tradeId)

    if (!tradeDetail) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      )
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
