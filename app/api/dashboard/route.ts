import { NextRequest, NextResponse } from 'next/server'
import { buildDashboardData } from '@/lib/memory'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId') || 'trading-agent.near'

  try {
    const data = await buildDashboardData(accountId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
