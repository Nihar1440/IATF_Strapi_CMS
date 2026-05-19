import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { getAIProvider, extractJSON, AI_TIMEOUT_MS } from '@/lib/ai/provider'
import type { MatrixRow, ProcessEntry, ConflictInfo, ImplementationRecord } from '@/modules/csr/types'

export const runtime = 'nodejs'
export const maxDuration = 300

/* ─── Request / Response ────────────────────────────────────────── */

interface TranslateMatrixRequest {
  matrixRows: MatrixRow[]
  processes?: ProcessEntry[]
  conflicts?: ConflictInfo[]
  insights?: string[]
  implementationRecords?: Record<string, ImplementationRecord>
  sourceLanguage: 'en' | 'de'
  targetLanguage: 'en' | 'de'
}

/* ─── Batch size for translation ────────────────────────────────── */

const BATCH_SIZE = parseInt(process.env.TRANSLATE_BATCH_SIZE ?? '20', 10)

/* ─── Prompts ───────────────────────────────────────────────────── */

function buildSystemPrompt(targetLanguage: 'en' | 'de') {
  const langName = targetLanguage === 'de' ? 'German' : 'English'
  return `You are a professional translator specializing in automotive quality management (IATF 16949) and customer-specific requirements (CSR).

Translate the provided JSON content into ${langName}.

Rules:
1. For matrix rows, translate ONLY the "title" and "text" fields.
2. For processes, translate ONLY the "name" and "owner" fields.
3. For conflicts, translate ONLY the "description", "decision", and "reason" fields.
4. For insights, translate the string values.
5. For implementation records, translate ONLY text fields like "evidence", "assignee", "processOwner", "documentReference", "evidenceLocation".
6. Preserve all IDs and keys exactly as provided.
7. Use correct IATF 16949 / VDA automotive quality management terminology in ${langName} — never use generic literal translations.
8. Keep technical terms, standard references (e.g. "IATF 16949", "VDA 6.3"), part numbers, and abbreviations unchanged.
9. Maintain the exact same JSON structure.
10. Respond with ONLY the valid JSON — no markdown fences, no explanations.

Mandatory terminology (use these exact terms when translating EN↔DE):
- Customer-Specific Requirement ↔ Kundenspezifische Anforderung
- Management Review ↔ Managementbewertung
- Design & Development ↔ Entwicklung / Produktentwicklung
- Production ↔ Produktion / Fertigung
- Purchasing / Procurement ↔ Beschaffung / Einkauf
- Incoming Inspection ↔ Wareneingangsprüfung
- Calibration ↔ Kalibrierung / Prüfmittelüberwachung
- Internal Audit ↔ Internes Audit
- Corrective Action ↔ Korrekturmaßnahmen
- Continuous Improvement ↔ Kontinuierliche Verbesserung (KVP)
- Document Control ↔ Dokumentenlenkung
- Nonconforming Output ↔ Fehlerhaftes Produkt / Lenkung fehlerhafter Teile
- Control Plan ↔ Produktionslenkungsplan
- FMEA ↔ FMEA (keep as-is)
- Supplier Management ↔ Lieferantenmanagement
- Competence / Training ↔ Kompetenz / Schulung
- Maintenance ↔ Instandhaltung
- Risk Management ↔ Risikomanagement
- Measurement System Analysis ↔ Messsystemanalyse (MSA)
- Statistical Process Control ↔ Statistische Prozesslenkung (SPC)
- Product Approval Process ↔ Produktfreigabeverfahren (PPAP/PPF)
- Management Processes ↔ Führungsprozesse / Managementprozesse
- Customer-Oriented Processes ↔ Kundenorientierte Prozesse / Wertschöpfungsprozesse
- Support Processes ↔ Unterstützende Prozesse / Unterstützungsprozesse`
}

function buildUserPrompt(rows: any) {
  return `Translate the relevant text fields of each entry. Return the exact same JSON structure with the translated text:

${JSON.stringify(rows)}`
}

/* ─── Route handler ─────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: TranslateMatrixRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { matrixRows, processes = [], conflicts = [], insights = [], implementationRecords = {}, sourceLanguage, targetLanguage } = body

  if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
    return NextResponse.json({ error: 'No matrix data' }, { status: 400 })
  }

  if (sourceLanguage === targetLanguage) {
    // No translation needed — return as-is
    return NextResponse.json({ matrixRows, processes, conflicts, insights, implementationRecords })
  }

  try {
    const provider = getAIProvider()
    const systemPrompt = buildSystemPrompt(targetLanguage)
    const translatedRows = [...matrixRows]
    let translatedProcesses = [...processes]
    let translatedConflicts = [...conflicts]
    let translatedInsights = [...insights]
    let translatedRecords = { ...implementationRecords }

    // Build batches
    const batches: { type: 'matrix' | 'extras'; payload: any }[] = []

    // Matrix batches
    for (let i = 0; i < matrixRows.length; i += BATCH_SIZE) {
      const batch = matrixRows.slice(i, i + BATCH_SIZE)
      const batchPayload = batch.map((r) => ({ csrId: r.csrId, title: r.title, text: r.text }))
      batches.push({ type: 'matrix', payload: batchPayload })
    }

    // Extras batch
    if (processes.length > 0 || conflicts.length > 0 || insights.length > 0 || Object.keys(implementationRecords).length > 0) {
      const extrasPayload: any = {}
      if (processes.length > 0) extrasPayload.processes = processes.map(p => ({ id: p.id, name: p.name, owner: p.owner }))
      if (conflicts.length > 0) extrasPayload.conflicts = conflicts.map(c => ({ iatfChapter: c.iatfChapter, description: c.description, decision: c.decision, reason: c.reason }))
      if (insights.length > 0) extrasPayload.insights = insights
      if (Object.keys(implementationRecords).length > 0) {
        extrasPayload.implementationRecords = {}
        for (const [k, v] of Object.entries(implementationRecords)) {
          extrasPayload.implementationRecords[k] = {
            evidence: v.evidence, assignee: v.assignee, processOwner: v.processOwner,
            documentReference: v.documentReference, evidenceLocation: v.evidenceLocation
          }
        }
      }
      batches.push({ type: 'extras', payload: extrasPayload })
    }

    // Compute a safe concurrency so total wall-clock time stays under the route's maxDuration.
    // Allow environment overrides but cap concurrency to avoid blasting the AI provider.
    const batchesCount = batches.length
    const safetyMarginMs = Math.max(1000, parseInt(process.env.TRANSLATE_SAFETY_MARGIN_MS ?? '5000', 10))
    const allowedMs = (typeof maxDuration === 'number' ? maxDuration : 60) * 1000 - safetyMarginMs
    const maxConcurrencyCap = Math.max(1, parseInt(process.env.TRANSLATE_MAX_CONCURRENCY ?? '20', 10))
    const envConcurrency = parseInt(process.env.TRANSLATE_CONCURRENCY ?? '0', 10)

    let CONCURRENCY: number
    if (envConcurrency > 0) {
      CONCURRENCY = Math.min(envConcurrency, batchesCount, maxConcurrencyCap)
    } else {
      CONCURRENCY = Math.min(batchesCount, maxConcurrencyCap)
    }

    console.log(`[Translate Matrix] ${batchesCount} batches, chosen concurrency=${CONCURRENCY}, provider=${provider.name}, AI_TIMEOUT_MS=${AI_TIMEOUT_MS}, allowedMs=${allowedMs}`)

    const startTs = Date.now()

    async function processBatch(batch: { type: 'matrix' | 'extras', payload: any }, batchIndex: number) {
      const bs = Date.now()
      const itemCount = batch.type === 'matrix' ? batch.payload.length : Object.keys(batch.payload).length
      console.log(`[Translate Matrix] Batch ${batchIndex} (${batch.type}) start (${itemCount} items)`)
      try {
        const rawResponse = await provider.complete(
          [{ role: 'user', content: buildUserPrompt(batch.payload) }],
          systemPrompt,
          { maxTokens: 8192, temperature: 0.1 },
        )

        const be = Date.now()
        console.log(`[Translate Matrix] Batch ${batchIndex} provider finished in ${be - bs}ms`)

        const jsonStr = extractJSON(rawResponse)
        try {
          return { type: batch.type, parsed: JSON.parse(jsonStr) }
        } catch (err) {
          console.error('[Translate Matrix] Failed to parse AI response for batch', batchIndex, err)
          return null
        }
      } catch (err) {
        console.error('[Translate Matrix] Provider error for batch', batchIndex, err)
        return null
      }
    }

    // Run batches with limited concurrency to reduce wall-clock time
    const results: ({ type: 'matrix' | 'extras', parsed: any } | null)[] = new Array(batches.length)
    let next = 0
    const workers = new Array(CONCURRENCY).fill(null).map(async () => {
      while (true) {
        const idx = next++
        if (idx >= batches.length) break
        results[idx] = await processBatch(batches[idx], idx)
      }
    })

    await Promise.all(workers)

    const totalMs = Date.now() - startTs
    console.log(`[Translate Matrix] All batches processed in ${totalMs}ms`)

    // Merge translated values back
    for (const result of results) {
      if (!result) continue

      const { type, parsed } = result

      if (type === 'matrix') {
        const rows = Array.isArray(parsed) ? parsed : (parsed.data || parsed.matrixRows || parsed.rows || [parsed])
        for (const translated of rows) {
          if (!translated || typeof translated !== 'object' || !translated.csrId) continue
          const idx = translatedRows.findIndex((r) => r.csrId === translated.csrId)
          if (idx !== -1) {
            translatedRows[idx] = {
              ...translatedRows[idx],
              title: translated.title || translatedRows[idx].title,
              text: translated.text || translatedRows[idx].text,
            }
          }
        }
      } else if (type === 'extras') {
        if (parsed.processes && Array.isArray(parsed.processes)) {
          translatedProcesses = translatedProcesses.map(p => {
            const found = parsed.processes.find((tp: any) => tp.id === p.id)
            return found ? { ...p, name: found.name || p.name, owner: found.owner || p.owner } : p
          })
        }
        if (parsed.conflicts && Array.isArray(parsed.conflicts)) {
          translatedConflicts = translatedConflicts.map(c => {
            const found = parsed.conflicts.find((tc: any) => tc.iatfChapter === c.iatfChapter)
            if (!found) return c
            return {
              ...c,
              description: found.description || c.description,
              decision: found.decision || c.decision,
              reason: found.reason || c.reason,
            }
          })
        }
        if (parsed.insights && Array.isArray(parsed.insights)) {
          translatedInsights = parsed.insights
        }
        if (parsed.implementationRecords) {
          for (const [k, obj] of Object.entries(parsed.implementationRecords)) {
            if (translatedRecords[k] && obj && typeof obj === 'object') {
              const typedObj = obj as any
              translatedRecords[k] = {
                ...translatedRecords[k],
                evidence: typedObj.evidence || translatedRecords[k].evidence,
                assignee: typedObj.assignee || translatedRecords[k].assignee,
                processOwner: typedObj.processOwner || translatedRecords[k].processOwner,
                documentReference: typedObj.documentReference || translatedRecords[k].documentReference,
                evidenceLocation: typedObj.evidenceLocation || translatedRecords[k].evidenceLocation,
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      matrixRows: translatedRows,
      processes: translatedProcesses,
      conflicts: translatedConflicts,
      insights: translatedInsights,
      implementationRecords: translatedRecords
    })
  } catch (err) {
    console.error('[Translate Matrix] Translation failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Matrix translation failed' },
      { status: 500 },
    )
  }
}
