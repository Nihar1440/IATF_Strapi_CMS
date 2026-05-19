import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function readTokenFromRequest(request: Request): string {
  const adminToken = request.headers.get('x-admin-token')
  if (adminToken) {
    return adminToken
  }

  const authorization = request.headers.get('authorization') || ''
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim()
  }

  return ''
}

export function isBillingAdminAuthorized(request: Request): boolean {
  const expectedToken = process.env.BILLING_ADMIN_TOKEN || ''

  if (!expectedToken) {
    return false
  }

  const providedToken = readTokenFromRequest(request)
  return providedToken.length > 0 && safeEqual(providedToken, expectedToken)
}

export function requireBillingAdmin(request: Request): NextResponse | null {
  if (isBillingAdminAuthorized(request)) {
    return null
  }

  if (!process.env.BILLING_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'BILLING_ADMIN_TOKEN is not configured on the server.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ error: 'Unauthorized admin request.' }, { status: 401 })
}
