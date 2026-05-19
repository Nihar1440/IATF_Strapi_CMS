import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit/rateLimit'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { generateFmeaAiFindings } from '@/modules/fmea/lib/aiFindings'
import type { FmeaRow, FmeaIssue } from '@/modules/fmea/types'

export const maxDuration = 300

type FmeaAIType = 'generate-findings'

interface BasePayload {
  type: FmeaAIType
  language?: string
}

export async function POST(request: NextRequest) {
  // 1. Rate limit check
  const allowed = await checkRateLimit(request)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  // 2. Authentication check
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BasePayload & Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, language = 'en' } = body

  if (!type) {
    return NextResponse.json({ error: 'Missing "type" field' }, { status: 400 })
  }

  try {
    switch (type) {
      // ─── AI Findings Generation ──────────────────────────
      case 'generate-findings': {
        const rows = body.rows as FmeaRow[] | undefined
        const issues = body.issues as Array<FmeaIssue & { row_id: string }> | undefined

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          return NextResponse.json(
            { error: 'rows array is required and must not be empty' },
            { status: 400 },
          )
        }

        if (!issues || !Array.isArray(issues)) {
          return NextResponse.json(
            { error: 'issues array is required' },
            { status: 400 },
          )
        }

        const findings = await generateFmeaAiFindings(
          rows,
          issues,
          language === 'de' ? 'de' : 'en',
        )

        return NextResponse.json({
          findings,
          count: findings.length,
          aiPowered: true,
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown AI type: ${type}` },
          { status: 400 },
        )
    }
  } catch (err) {
    console.error(`[FMEA AI] Error processing ${type}:`, err)
    const message =
      err instanceof Error ? err.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
