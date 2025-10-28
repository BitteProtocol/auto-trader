import { NextRequest, NextResponse } from 'next/server'
import { loadConfig } from './config'

type AuthenticatedCallHandler = (req: NextRequest) => Promise<NextResponse>

export function withCronSecret(handler: AuthenticatedCallHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { cronSecret } = loadConfig()
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req)
  }
}
