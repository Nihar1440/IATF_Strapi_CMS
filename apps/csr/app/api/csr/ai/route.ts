import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { getCsrForOems } from '@/modules/csr/data'
import {
  aiGenerateMatrix,
  aiAnalyzeProcessMap,
  aiAnalyzeProcessMapImage,
  aiExplainRequirement,
} from '@/modules/csr/lib/aiMatrixAnalysis'
import {
  aiRefreshCsrData,
  convertUpdatesToCsrRequirements,
} from '@/modules/csr/lib/aiDataRefresh'
import { saveCsrUpdates } from '@/lib/redis/csrUpdateStore'
import type { OemId, ProcessEntry } from '@/modules/csr/types'

export const maxDuration = 300

type CsrAIType =
  | 'generate-matrix'
  | 'analyze-processes'
  | 'analyze-process-image'
  | 'explain-requirement'
  | 'refresh-data'

interface BasePayload {
  type: CsrAIType
  language?: string
}

export async function POST(request: NextRequest) {
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
      // ─── AI Matrix Generation ────────────────────────────
      case 'generate-matrix': {
        const oems = body.oems as OemId[] | undefined
        const processes = body.processes as ProcessEntry[] | undefined

        if (!oems?.length || !processes?.length) {
          return NextResponse.json(
            { error: 'oems and processes are required' },
            { status: 400 },
          )
        }

        const csrRows = getCsrForOems(oems)
        const result = await aiGenerateMatrix(csrRows, processes, language)

        return NextResponse.json({
          matrixId: `csr-ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          rows: result.matrixRows.length,
          matrixRows: result.matrixRows,
          conflicts: result.conflicts,
          insights: result.insights,
          aiPowered: true,
        })
      }

      // ─── AI Process Map Analysis ─────────────────────────
      case 'analyze-processes': {
        const processes = body.processes as ProcessEntry[] | undefined
        const selectedOems = body.oems as OemId[] | undefined

        if (!processes?.length) {
          return NextResponse.json(
            { error: 'processes are required' },
            { status: 400 },
          )
        }

        const analysis = await aiAnalyzeProcessMap(
          processes,
          selectedOems ?? [],
          language,
        )

        return NextResponse.json({ analysis, aiPowered: true })
      }

      // ─── AI Process Map Image Analysis ──────────────────
      case 'analyze-process-image': {
        const imageData = body.imageData as string | undefined
        const imageMimeType = body.imageMimeType as string | undefined

        if (!imageData || !imageMimeType) {
          return NextResponse.json(
            { error: 'imageData and imageMimeType are required' },
            { status: 400 },
          )
        }

        // Validate MIME type
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!allowedMimes.includes(imageMimeType)) {
          return NextResponse.json(
            { error: 'Unsupported image type' },
            { status: 400 },
          )
        }

        // Validate base64 size (limit ~5MB decoded ≈ ~6.7MB base64)
        if (imageData.length > 7_000_000) {
          return NextResponse.json(
            { error: 'Image too large' },
            { status: 400 },
          )
        }

        const imageResult = await aiAnalyzeProcessMapImage(
          imageData,
          imageMimeType,
          language,
        )

        return NextResponse.json({
          processes: imageResult.processes,
          summary: imageResult.summary,
          aiPowered: true,
        })
      }

      // ─── AI Requirement Explanation ──────────────────────
      case 'explain-requirement': {
        const csrId = body.csrId as string | undefined
        const oems = body.oems as OemId[] | undefined
        const processes = body.processes as ProcessEntry[] | undefined

        if (!csrId) {
          return NextResponse.json(
            { error: 'csrId is required' },
            { status: 400 },
          )
        }

        const allCsr = getCsrForOems(oems ?? [])
        const csr = allCsr.find((c) => c.id === csrId)

        if (!csr) {
          return NextResponse.json(
            { error: 'CSR requirement not found' },
            { status: 404 },
          )
        }

        const explanation = await aiExplainRequirement(
          csr,
          processes ?? [],
          language,
        )

        return NextResponse.json({ ...explanation, aiPowered: true })
      }

      // ─── AI Data Refresh ─────────────────────────────────
      case 'refresh-data': {
        const oems = body.oems as OemId[] | undefined

        if (!oems?.length) {
          return NextResponse.json(
            { error: 'oems are required' },
            { status: 400 },
          )
        }

        const existing = getCsrForOems(oems)
        const refreshResult = await aiRefreshCsrData(oems, existing, language)

        // Convert high/medium confidence updates to usable CSR format
        const newRequirements = convertUpdatesToCsrRequirements(
          refreshResult.updates,
        )

        // Persist high-confidence updates to Redis for future matrix generations
        if (newRequirements.length > 0) {
          try {
            await saveCsrUpdates(newRequirements, oems)
          } catch (persistErr) {
            console.warn('[CSR AI] Failed to persist updates to Redis:', persistErr)
          }
        }

        return NextResponse.json({
          updates: refreshResult.updates,
          newRequirements,
          sanctionedInterpretations: refreshResult.sanctionedInterpretations,
          oemChanges: refreshResult.oemChanges,
          lastKnownUpdate: refreshResult.lastKnownUpdate,
          disclaimer: refreshResult.disclaimer,
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
    console.error(`[CSR AI] Error processing ${type}:`, err)
    const message =
      err instanceof Error ? err.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
