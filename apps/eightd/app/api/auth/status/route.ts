import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/session/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticatedFromRequest(request)
    const response = NextResponse.json({ authenticated })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch {
    const response = NextResponse.json({ authenticated: false })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }
}