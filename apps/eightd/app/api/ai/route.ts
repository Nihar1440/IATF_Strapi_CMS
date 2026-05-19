/**
 * AI API Route — `/api/ai`
 *
 * Unified endpoint for all 4 AI calls:
 * - assist: D1/D2 field improvement
 * - sufficiency: D2 sufficiency gate
 * - generation: D3 + D4 + D5 generation
 * - consistency: post-edit consistency check
 *
 * All calls are server-side only. No complaint data is logged.
 */

import { NextRequest, NextResponse } from 'next/server'
import { assistField } from '@/modules/eightd/lib/assistField'
import { checkSufficiency } from '@/modules/eightd/lib/sufficiencyCheck'
import { generateReport } from '@/modules/eightd/lib/generateReport'
import { generateD3D4 } from '@/modules/eightd/lib/generateD3D4'
import { generateD5 } from '@/modules/eightd/lib/generateD5'
import { generateD6 } from '@/modules/eightd/lib/generateD6'
import { generateD7 } from '@/modules/eightd/lib/generateD7'
import { checkConsistency } from '@/modules/eightd/lib/consistencyCheck'
import { completeChain } from '@/modules/eightd/lib/completeChain'
import { backfillRootCauseChain } from '@/modules/eightd/lib/rootCauseBackfill'
import { extractComplaint } from '@/modules/eightd/lib/complaintExtraction'
import { translateText } from '@/modules/eightd/lib/textTranslation'
import { translateReport } from '@/modules/eightd/lib/reportTranslation'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import type { AIApiRequest, AIApiResponse } from '@/modules/eightd/types/ai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────
    if (!(await isAuthenticatedFromRequest(req))) {
      return NextResponse.json<AIApiResponse>(
        { success: false, error: 'Unauthorized — please redeem an access code first.' },
        { status: 401 },
      )
    }

    // ── Parse body ──────────────────────────────────────────────────────
    let body: AIApiRequest
    try {
      body = await req.json()
    } catch {
      return NextResponse.json<AIApiResponse>(
        { success: false, error: 'Invalid request body.' },
        { status: 400 },
      )
    }

    const { type, language, payload } = body

    // Log minimal request diagnostics (no sensitive payload values)
    console.info('[AI Route] Request received', {
      type,
      language,
      payloadBytes: JSON.stringify(payload).length,
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      aiProvider: (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase(),
    })

    if (!type || !language || !payload) {
      return NextResponse.json<AIApiResponse>(
        { success: false, error: 'Missing required fields: type, language, payload.' },
        { status: 400 },
      )
    }

    // ── Dispatch to the correct AI call ─────────────────────────────────
    let result: { success: boolean; data?: unknown; error?: string }

    switch (type) {
      case 'assist':
        result = await assistField(payload as Parameters<typeof assistField>[0], language)
        break

      case 'sufficiency':
        result = await checkSufficiency(payload as Parameters<typeof checkSufficiency>[0], language)
        break

      case 'generation':
        result = await generateReport(payload as Parameters<typeof generateReport>[0], language)
        break

      case 'generation-d3d4':
        result = await generateD3D4(payload as Parameters<typeof generateD3D4>[0], language)
        break

      case 'generation-d5':
        result = await generateD5(payload as Parameters<typeof generateD5>[0], language)
        break

      case 'generation-d6':
        result = await generateD6(payload as Parameters<typeof generateD6>[0], language)
        break

      case 'generation-d7':
        result = await generateD7(payload as Parameters<typeof generateD7>[0], language)
        break

      case 'consistency':
        result = await checkConsistency(payload as Parameters<typeof checkConsistency>[0], language)
        break

      case 'chainCompletion':
        result = await completeChain(payload as Parameters<typeof completeChain>[0], language)
        break

      case 'rootCauseBackfill':
        result = await backfillRootCauseChain(
          payload as Parameters<typeof backfillRootCauseChain>[0],
          language,
        )
        break

      case 'complaintExtraction':
        result = await extractComplaint(payload as Parameters<typeof extractComplaint>[0], language)
        break

      case 'textTranslation':
        result = await translateText(payload as Parameters<typeof translateText>[0])
        break

      case 'reportTranslation':
        result = await translateReport(payload as Parameters<typeof translateReport>[0])
        break

      default:
        return NextResponse.json<AIApiResponse>(
          { success: false, error: `Unknown AI call type: ${type}` },
          { status: 400 },
        )
    }

    // ── Return result ───────────────────────────────────────────────────
    if (result.success) {
      return NextResponse.json<AIApiResponse>({ success: true, data: result.data })
    }

    console.error('[AI Route] AI call failed:', result.error)
    return NextResponse.json<AIApiResponse>(
      { success: false, error: result.error },
      { status: 500 },
    )
  } catch (err) {
    // Log error type + stack for server-side debugging (payload is never logged)
    console.error('[AI Route] Unexpected error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json<AIApiResponse>(
      {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during AI processing.',
      },
      { status: 500 },
    )
  }
}
