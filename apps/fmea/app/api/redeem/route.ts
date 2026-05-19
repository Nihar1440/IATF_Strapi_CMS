import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit/rateLimit'
import { redeemCode, type RedeemResult } from '@/lib/redis/codeStore'
import { createToken } from '@/lib/session/session'
import { setSessionCookie } from '@/lib/session/cookie'
import { fmeaRedeemSchema as redeemSchema } from '@/modules/fmea/schemas/formSchemas'

export async function POST(request: NextRequest) {
  // 1. Rate limit check
  const allowed = await checkRateLimit(request)
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  // 2. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = redeemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid code format' },
      { status: 400 }
    )
  }

  const { code } = parsed.data

  // Optional toolId from body, fallback to FMEA tool id
  const extractedToolId = (typeof body === 'object' && body !== null && 'toolId' in body && typeof (body as Record<string, unknown>).toolId === 'string')
    ? (body as Record<string, unknown>).toolId as string
    : 'tool_fmea'

  // 3. Atomically validate and redeem code
  let result: RedeemResult
  try {
    result = await redeemCode(code, extractedToolId)
  } catch (err) {
    console.error('[redeem] Redis error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ success: false, error: 'Service unavailable. Please try again.' }, { status: 503 })
  }

  if (!result.success && result.reason !== 'already_used') {
    let errorMessage = 'Invalid access code'
    if (result.reason === 'invalid_tool') errorMessage = 'Code not valid for this tool'
      
    return NextResponse.json({ success: false, error: errorMessage }, { status: 401 })
  }

  // 4. Issue encrypted token — set both HttpOnly cookie and return in body (backward compat)
  try {
    const token = await createToken(code)
    const response = NextResponse.json({ success: true, token, code })
    setSessionCookie(response, token)
    return response
  } catch (err) {
    console.error('[redeem] Token error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 })
  }
}
