import { NextRequest, NextResponse } from 'next/server'
import { getCsrForOems, buildMatrix, detectConflicts } from '@/modules/csr/data'
import { aiGenerateMatrix } from '@/modules/csr/lib/aiMatrixAnalysis'
import { generateMatrixSchema } from '@/modules/csr/schemas/formSchemas'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { getCsrUpdates } from '@/lib/redis/csrUpdateStore'
import type { ProcessEntry, CsrRequirement, OemId } from '@/modules/csr/types'

export const maxDuration = 300

/** Fetch CSR requirements from Strapi CMS, falling back to local data. */
async function getStrapiCsrForOems(oemIds: string[]): Promise<CsrRequirement[]> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL
  const strapiToken = process.env.STRAPI_API_TOKEN

  if (strapiUrl && strapiToken) {
    try {
      const url = new URL('/api/csr-requirements', strapiUrl)
      url.searchParams.set('filters[active][$eq]', 'true')
      url.searchParams.set('pagination[pageSize]', '500')
      url.searchParams.set('sort', 'iatfChapter:asc')
      // Include base IATF (no oemId) + selected OEMs
      url.searchParams.set('filters[$or][0][oemId][$null]', 'true')
      oemIds.forEach((id, i) => {
        url.searchParams.set(`filters[$or][${i + 1}][oemId][$eq]`, id)
      })

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${strapiToken}` },
        next: { revalidate: 300 },
      })

      if (res.ok) {
        const json = (await res.json()) as {
          data: Array<{
            requirementId: string
            iatfChapter: string
            title: string
            oemId: OemId | null
            text: string
            version: string
            changeStatus: CsrRequirement['changeStatus']
            risk: CsrRequirement['risk']
            severity: CsrRequirement['severity']
            sourceDoc: string
            conflictFlag: boolean
            active: boolean
            lastUpdated: string
            overIatfFlag: boolean
            tags?: string[]
          }>
        }

        if (json.data.length > 0) {
          return json.data.map((d) => ({
            id: d.requirementId,
            iatfChapter: d.iatfChapter,
            title: d.title,
            oem: d.oemId,
            text: d.text,
            version: d.version ?? d.sourceDoc,
            changeStatus: d.changeStatus,
            risk: d.risk,
            severity: d.severity,
            sourceDoc: d.sourceDoc,
            conflictFlag: d.conflictFlag,
            active: d.active,
            lastUpdated: d.lastUpdated,
            overIatfFlag: d.overIatfFlag,
            tags: d.tags,
          }))
        }
      }
    } catch {
      // Strapi unavailable — fall through to local data
    }
  }

  return getCsrForOems(oemIds)
}

/**
 * POST /api/csr/generate-matrix
 *
 * Generates the CSR matrix for the selected OEMs and process map.
 * Uses AI-powered analysis for intelligent process mapping when available,
 * falls back to static prefix matching if AI fails.
 */
export async function POST(request: NextRequest) {
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = generateMatrixSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { oems, processes, companyName, language } = parsed.data
  const seedRows = await getStrapiCsrForOems(oems)

  // Merge seed data with any AI-discovered updates stored in Redis
  let csrRows = seedRows
  try {
    const redisUpdates = await getCsrUpdates()
    if (redisUpdates.length > 0) {
      const seedIds = new Set(seedRows.map((r) => r.id))
      const extras = redisUpdates.filter(
        (r) => !seedIds.has(r.id) && (r.oem === null || oems.includes(r.oem)),
      )
      csrRows = [...seedRows, ...extras]
    }
  } catch {
    // Redis unavailable — use seed data only
  }

  const matrixId = `csr-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

  // Try AI-powered generation first
  const hasAIKey = !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY
  )

  if (hasAIKey) {
    try {
      const result = await aiGenerateMatrix(
        csrRows,
        processes as ProcessEntry[],
        language,
      )

      // If AI returned an empty matrix (parse error fallback), use static instead
      if (result.matrixRows.length > 0) {
        return NextResponse.json({
          matrixId,
          rows: result.matrixRows.length,
          matrixRows: result.matrixRows,
          conflicts: result.conflicts,
          insights: result.insights,
          aiPowered: true,
          meta: {
            oems,
            companyName: companyName ?? '',
            language,
            generatedAt: new Date().toISOString(),
          },
        })
      }
    } catch (err) {
      console.warn(
        '[CSR] AI matrix generation failed, falling back to static:',
        err instanceof Error ? err.message : err,
      )
    }
  }

  // Fallback: static prefix matching
  const matrixRows = buildMatrix(csrRows, processes as ProcessEntry[])
  const conflicts = await detectConflicts(csrRows, language as 'en' | 'de')

  return NextResponse.json({
    matrixId,
    rows: matrixRows.length,
    matrixRows,
    conflicts,
    insights: [],
    aiPowered: false,
    meta: {
      oems,
      companyName: companyName ?? '',
      language,
      generatedAt: new Date().toISOString(),
    },
  })
}
