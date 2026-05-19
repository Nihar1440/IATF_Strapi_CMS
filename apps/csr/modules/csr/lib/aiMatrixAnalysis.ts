/* ------------------------------------------------------------------ */
/*  AI-Powered CSR Matrix Analysis                                    */
/*                                                                    */
/*  Uses LLM intelligence to:                                         */
/*    1. Map IATF chapters to user processes (tiny targeted prompt)   */
/*    2. Detect & explain OEM conflicts with resolution suggestions   */
/*    3. Provide practical insights about the matrix                  */
/*                                                                    */
/*  Performance design:                                               */
/*    - ONLY unique chapter numbers + process list sent to AI         */
/*    - Static logic applies the AI chapter→process map to all rows  */
/*    - Max tokens 1500 — stays well within rate limits              */
/* ------------------------------------------------------------------ */

import { getAIProvider, extractJSON } from '@/lib/ai/provider'
import { detectConflicts } from '../data/processMapping'
import type {
  CsrRequirement,
  ProcessEntry,
  MatrixRow,
  ConflictInfo,
  OemId,
} from '../types'

// ─── System Prompt ────────────────────────────────────────────────────────────

const CSR_MATRIX_SYSTEM_PROMPT = `You are an IATF 16949 automotive quality management expert.
Map IATF 16949 chapter numbers to company processes using semantic understanding.
Rules:
- A chapter may affect multiple processes (e.g. 7.1.5 calibration → lab AND production processes)
- Use ONLY process IDs from the provided list — no invented IDs
- Respond ONLY in the exact pipe-delimited format shown — no JSON, no markdown, no extra text`

// ─── Pipe-delimited text parser (truncation-safe) ─────────────────────────────

function parseChapterMap(raw: string): { chapterMapping: Record<string, string[]>; insights: string[] } {
  const chapterMapping: Record<string, string[]> = {}
  const insights: string[] = []
  let inInsights = false

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.toUpperCase().startsWith('INSIGHTS:')) {
      inInsights = true
      continue
    }

    if (inInsights) {
      // Lines like "- observation" or "* observation" or plain text
      const text = trimmed.replace(/^[-*•]\s*/, '').trim()
      if (text) insights.push(text)
      continue
    }

    // Chapter line: "8.5.1.1|P-COP-05|P-SUP-02"
    const parts = trimmed.split('|').map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const chapter = parts[0]
      const processIds = parts.slice(1)
      // Validate: chapter must look like a numeric dotted ID
      if (/^\d[\d.]*$/.test(chapter)) {
        chapterMapping[chapter] = processIds
      }
    }
    // Lines that don't match the format are silently ignored — safe with truncation
  }

  return { chapterMapping, insights }
}

// ─── AI Chapter→Process Mapping ───────────────────────────────────────────────

// (no longer need AIChapterMapResponse interface — parser returns the shape directly)

export async function aiGenerateMatrix(
  csrRows: CsrRequirement[],
  processes: ProcessEntry[],
  language: string,
): Promise<{ matrixRows: MatrixRow[]; conflicts: ConflictInfo[]; insights: string[] }> {
  const ai = getAIProvider()

  // If a non-English language is requested, translate the CSR titles/texts
  // before applying the AI chapter->process mapping so the matrix content
  // appears in the selected locale.
  async function translateCsrRowsIfNeeded(rows: CsrRequirement[], targetLanguage: string) {
    if (!rows || rows.length === 0) return rows
    if (targetLanguage === 'en') return rows

    const BATCH = Math.max(1, parseInt(process.env.TRANSLATE_BATCH_SIZE ?? '20', 10))
    const systemPrompt = `You are a professional translator specializing in automotive quality management (IATF 16949) and customer-specific requirements (CSR).

Translate the provided array of CSR requirement entries into ${targetLanguage === 'de' ? 'German' : 'English'}.

Rules:
1. Translate ONLY the \"title\" and \"text\" fields.
2. Preserve all other fields exactly as provided (id, iatfChapter, oem, version, risk, severity, etc.).
3. Use correct IATF 16949 / VDA automotive quality management terminology — never use generic literal translations.
4. Keep technical terms, standard references (e.g. \"IATF 16949\", \"VDA 6.3\"), part numbers, and abbreviations unchanged.
5. Maintain the exact same JSON array structure.
6. Respond with ONLY the valid JSON array — no markdown fences, no explanations.

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
- Product Approval Process ↔ Produktfreigabeverfahren (PPAP/PPF)`

    function buildUserPrompt(batch: { id: string; title: string; text: string }[]) {
      return `Translate the \"title\" and \"text\" of each entry. Return an array with the same id, translated title, and translated text:\n\n${JSON.stringify(batch)}`
    }

    const translatedRows = [...rows]

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const payload = batch.map((r) => ({ id: r.id, title: r.title, text: r.text }))

      try {
        const raw = await ai.complete(
          [{ role: 'user', content: buildUserPrompt(payload) }],
          systemPrompt,
          { maxTokens: 8192, temperature: 0.1 },
        )

        const jsonStr = extractJSON(raw)
        try {
          const parsed = JSON.parse(jsonStr) as { id: string; title?: string; text?: string }[]
          for (const p of parsed) {
            const idx = translatedRows.findIndex((r) => r.id === p.id)
            if (idx !== -1) {
              translatedRows[idx] = {
                ...translatedRows[idx],
                title: p.title ?? translatedRows[idx].title,
                text: p.text ?? translatedRows[idx].text,
              }
            }
          }
        } catch (err) {
          console.error('[CSR AI] Failed to parse translation response for CSR batch', i / BATCH, err)
          // proceed with original rows for this batch
        }
      } catch (err) {
        console.error('[CSR AI] Translation provider error for CSR batch', i / BATCH, err)
        // On provider errors, continue with original rows
      }
    }

    return translatedRows
  }

  // Translate CSR rows into the requested language if needed
  try {
    csrRows = await translateCsrRowsIfNeeded(csrRows, language)
  } catch (err) {
    console.warn('[CSR AI] Translation step failed, continuing with original language', err)
  }

  // Extract only unique chapters — don't send full requirement text
  const uniqueChapters = [...new Set(csrRows.map((r) => r.iatfChapter))].sort()
  const processList = processes.map((p) => `${p.id}: ${p.name}`).join('\n')

  const userPrompt = `Map these IATF 16949 chapters to our company processes.

COMPANY PROCESSES:
${processList}

IATF 16949 CHAPTERS TO MAP (${uniqueChapters.length} unique chapters):
${uniqueChapters.join(', ')}

For EACH chapter output exactly one line using pipe-separated format:
<chapter>|<process_id>|<process_id>|...

Example:
4.3.1|P-SUP-01|P-SUP-02
8.5.1.1|P-COP-05|P-SUP-02

After all chapter lines, write "INSIGHTS:" on its own line, then 2-3 insights as bullet points in ${language === 'de' ? 'German' : 'English'}.
No JSON. No markdown. No additional text.`

  const raw = await ai.complete(
    [{ role: 'user', content: userPrompt }],
    CSR_MATRIX_SYSTEM_PROMPT,
    { maxTokens: 3000, temperature: 0.2 },
  )

  const { chapterMapping, insights } = parseChapterMap(raw)

  const mappedCount = Object.keys(chapterMapping).length
  if (mappedCount === 0) {
    console.error('[CSR AI] No chapter mappings parsed from response, using static fallback')
    console.error('[CSR AI] Raw (first 300):', raw.substring(0, 300))
    return { matrixRows: [], conflicts: [], insights: [] }
  }

  console.log(`[CSR AI] Parsed ${mappedCount}/${uniqueChapters.length} chapter mappings, ${insights.length} insights`)

  const validProcessIds = new Set(processes.map((p) => p.id))

  // Apply the AI chapter→process map to all CSR rows
  const matrixRows: MatrixRow[] = csrRows.map((csr) => {
    const rawIds: string[] = chapterMapping[csr.iatfChapter] ?? []
    // Filter to only processes that actually exist in the user's map
    const affectedProcessIds = rawIds.filter((id) => validProcessIds.has(id))

    return {
      csrId: csr.id,
      iatfChapter: csr.iatfChapter,
      title: csr.title,
      oem: csr.oem ?? 'IATF 16949',
      text: csr.text,
      version: csr.version,
      changeStatus: csr.changeStatus,
      risk: csr.risk,
      severity: csr.severity,
      sourceDoc: csr.sourceDoc,
      active: csr.active,
      lastUpdated: csr.lastUpdated,
      affectedProcessIds,
      conflictFlag: false,
    }
  })

  // Use static conflict detection (fast, no tokens needed)
  const conflicts = await detectConflicts(csrRows, language as 'en' | 'de')

  // Mark conflict flags on rows
  const conflictChapters = new Set(conflicts.map((c) => c.iatfChapter))
  for (const row of matrixRows) {
    if (row.oem !== 'IATF 16949' && conflictChapters.has(row.iatfChapter)) {
      row.conflictFlag = true
    }
  }

  return {
    matrixRows,
    conflicts,
    insights,
  }
}

// ─── AI Process Map Image Analysis (Vision) ──────────────────────────────────

const PROCESS_IMAGE_SYSTEM_PROMPT = `You are an IATF 16949 automotive quality expert specializing in process mapping.
Analyze uploaded process landscape images (turtle diagrams, process maps, etc.) and extract structured process information.
For each process you identify, assign a standard ID using these prefixes:
- P-MAN-XX for Management processes (German: Führungsprozesse / Managementprozesse)
- P-COP-XX for Customer-Oriented Processes / value-adding (German: Kundenorientierte Prozesse / Wertschöpfungsprozesse)
- P-SUP-XX for Support processes (German: Unterstützende Prozesse / Unterstützungsprozesse)

IMPORTANT terminology rules:
- Preserve any numerical prefixes or identifiers in the process name exactly as they appear in the image (e.g., '110 Unternehmen planen'). Do NOT strip numbers.
- Use standardized IATF 16949 / VDA process terminology — never use generic literal translations.
- Common IATF process names (EN → DE):
  Management Review → Managementbewertung
  Customer Communication → Kundenkommunikation
  Design & Development → Entwicklung / Produktentwicklung
  Production / Manufacturing → Produktion / Fertigung
  Purchasing → Beschaffung / Einkauf
  Incoming Inspection → Wareneingangsprüfung
  Measurement & Monitoring → Mess- und Überwachungsprozesse
  Calibration → Kalibrierung / Prüfmittelüberwachung
  Internal Audit → Internes Audit
  Corrective Action → Korrekturmaßnahmen
  Continuous Improvement → Kontinuierliche Verbesserung (KVP)
  Document Control → Dokumentenlenkung
  Training / Competence → Schulung / Kompetenzmanagement
  Logistics / Warehousing → Logistik / Lagerhaltung
  Maintenance → Instandhaltung
  Customer Satisfaction → Kundenzufriedenheit
  Supplier Management → Lieferantenmanagement
  APQP / Launch → Produktionslenkungsplan / Serienanlauf
  Risk Management → Risikomanagement
- If the image text is in German, keep the original German term; do NOT back-translate to English and re-translate.
- If the image text is in English, translate to German only when the requested language is German.
Respond ONLY with valid JSON, no markdown, no extra text.`

export interface ExtractedProcess {
  id: string
  name: string
  owner: string
}

export async function aiAnalyzeProcessMapImage(
  imageBase64: string,
  imageMimeType: string,
  language: string,
): Promise<{ processes: ExtractedProcess[]; summary: string }> {
  const ai = getAIProvider()

  const userPrompt = `Analyze this process map / process landscape image.

Extract ALL processes visible in the image. For each process provide:
- A standard automotive process ID (P-MAN-01, P-COP-01, P-SUP-01, etc.)
- The process name exactly as shown in the image (or translated if in another language)
- The process owner if visible (leave empty string if not shown)

Respond in ${language === 'de' ? 'German' : 'English'}.

Return JSON:
{
  "processes": [
    { "id": "P-COP-01", "name": "Sales & Order Management", "owner": "" },
    { "id": "P-COP-02", "name": "Product Development", "owner": "" }
  ],
  "summary": "Brief 1-2 sentence description of the process landscape"
}`

  const raw = await ai.complete(
    [{
      role: 'user',
      content: userPrompt,
      imageBase64: imageBase64,
      imageMimeType: imageMimeType,
    }],
    PROCESS_IMAGE_SYSTEM_PROMPT,
    { maxTokens: 4096, temperature: 0.2 },
  )

  const parsed = JSON.parse(extractJSON(raw)) as { processes: ExtractedProcess[]; summary: string }

  if (!parsed.processes || !Array.isArray(parsed.processes) || parsed.processes.length === 0) {
    throw new Error('No processes could be extracted from the image')
  }

  console.log(`[CSR AI] Extracted ${parsed.processes.length} processes from image`)
  return parsed
}

// ─── AI Process Map Analysis ─────────────────────────────────────────────────

const PROCESS_ANALYSIS_PROMPT = `You are an IATF 16949 automotive quality expert specializing in process mapping.

Analyze the user's process list and provide:
1. Identification of any missing critical processes that IATF 16949 requires
2. Suggestions for better process naming alignment with IATF standards
3. Classification of each process (COP = Customer-Oriented, SUP = Support, MAN = Management)
4. Risk areas where the process map may be weak for CSR compliance

Always respond with valid JSON only.`

interface ProcessAnalysisResult {
  processClassifications: Array<{
    id: string
    name: string
    type: 'COP' | 'SUP' | 'MAN'
    iatfRelevance: string
  }>
  missingProcesses: Array<{
    suggestedId: string
    suggestedName: string
    type: 'COP' | 'SUP' | 'MAN'
    reason: string
  }>
  recommendations: string[]
}

export async function aiAnalyzeProcessMap(
  processes: ProcessEntry[],
  selectedOems: OemId[],
  language: string,
): Promise<ProcessAnalysisResult> {
  const ai = getAIProvider()

  const userPrompt = `Analyze this automotive company's process map for IATF 16949 compliance.

COMPANY PROCESSES:
${JSON.stringify(processes, null, 2)}

SELECTED OEMs: ${selectedOems.join(', ')}

Classify each process, identify gaps, and provide recommendations.
Respond in ${language === 'de' ? 'German' : 'English'}.

Return JSON:
{
  "processClassifications": [
    { "id": "...", "name": "...", "type": "COP|SUP|MAN", "iatfRelevance": "brief note" }
  ],
  "missingProcesses": [
    { "suggestedId": "P-SUP-XX", "suggestedName": "...", "type": "COP|SUP|MAN", "reason": "why needed" }
  ],
  "recommendations": ["..."]
}`

  const raw = await ai.complete(
    [{ role: 'user', content: userPrompt }],
    PROCESS_ANALYSIS_PROMPT,
    { maxTokens: 4096, temperature: 0.3 },
  )

  return JSON.parse(extractJSON(raw)) as ProcessAnalysisResult
}

// ─── AI Requirement Explanation ──────────────────────────────────────────────

export async function aiExplainRequirement(
  csr: CsrRequirement,
  processes: ProcessEntry[],
  language: string,
): Promise<{ explanation: string; implementationHints: string[]; auditFocus: string[] }> {
  const ai = getAIProvider()

  const userPrompt = `Explain this CSR requirement in practical terms for an automotive quality manager.

REQUIREMENT:
- ID: ${csr.id}
- IATF Chapter: ${csr.iatfChapter}
- Title: ${csr.title}
- OEM: ${csr.oem ?? 'IATF 16949 Base'}
- Text: ${csr.text}
- Risk: ${csr.risk}

COMPANY PROCESSES:
${processes.map((p) => `${p.id}: ${p.name}`).join('\n')}

Provide:
1. A clear, practical explanation of what this requirement means
2. Concrete implementation hints (what documents, records, or actions are needed)
3. What auditors will specifically look for (audit focus areas)

Respond in ${language === 'de' ? 'German' : 'English'}.

Return JSON:
{
  "explanation": "...",
  "implementationHints": ["..."],
  "auditFocus": ["..."]
}`

  const raw = await ai.complete(
    [{ role: 'user', content: userPrompt }],
    CSR_MATRIX_SYSTEM_PROMPT,
    { maxTokens: 2048, temperature: 0.3 },
  )

  return JSON.parse(extractJSON(raw))
}
