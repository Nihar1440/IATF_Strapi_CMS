/* ------------------------------------------------------------------ */
/*  AI-Powered CSR Data Auto-Update                                   */
/*                                                                    */
/*  Uses AI to analyze and incorporate the latest IATF 16949 and OEM  */
/*  CSR changes. Stores updated data in Redis alongside seed data.    */
/* ------------------------------------------------------------------ */

import { getAIProvider, extractJSON } from '@/lib/ai/provider'
import { performWebSearch } from '@/lib/ai/search'
import type { CsrRequirement, OemId, RiskLevel, ChangeStatus, CsrSeverity } from '../types'

// ─── System Prompt for Data Refresh ──────────────────────────────────────────

const DATA_REFRESH_SYSTEM_PROMPT = `You are an IATF 16949 automotive quality standards expert with up-to-date knowledge of:

- IATF 16949:2016 and all Sanctioned Interpretations (SIs) and FAQs published by the IATF
- The latest OEM Customer Specific Requirements (CSRs) for: BMW, VW/Audi, Mercedes-Benz, Stellantis (FCA/PSA), Ford, GM, Renault/Nissan, Toyota, Hyundai/Kia, Volvo
- VDA publications and updates relevant to IATF implementation
- Recent changes announced by OEMs to their quality requirements

When asked about updates, provide ONLY verified, factual information about known changes.
If you are not certain about a specific update, say so clearly — do not fabricate requirements.

IMPORTANT: Since OEM requirements update frequently, provide a standard, professional disclaimer advising the user to verify these recommendations directly against the latest official OEM portal downloads. Do NOT mention any specific "knowledge cutoff dates" or AI limitations in the disclaimer.

Always respond with valid JSON only.`

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsrUpdateEntry {
  id: string
  iatfChapter: string
  title: string
  oem: OemId | null
  text: string
  version: string
  changeStatus: ChangeStatus
  risk: RiskLevel
  severity: CsrSeverity | null
  sourceDoc: string
  effectiveDate: string
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

interface DataRefreshResult {
  updates: CsrUpdateEntry[]
  sanctionedInterpretations: Array<{
    siNumber: string
    iatfChapter: string
    summary: string
    effectiveDate: string
  }>
  oemChanges: Array<{
    oem: OemId
    documentName: string
    version: string
    summary: string
    effectiveDate: string
  }>
  lastKnownUpdate: string
  disclaimer: string
}

// ─── Main Refresh Function ───────────────────────────────────────────────────

export async function aiRefreshCsrData(
  currentOems: OemId[],
  existingRequirements: CsrRequirement[],
  language: string,
): Promise<DataRefreshResult> {
  const ai = getAIProvider()

  // Summarize what we currently have
  const existingSummary = existingRequirements
    .filter((r) => r.oem === null || currentOems.includes(r.oem))
    .map((r) => ({
      id: r.id,
      chapter: r.iatfChapter,
      oem: r.oem ?? 'IATF Base',
      version: r.version,
      lastUpdated: r.lastUpdated,
    }))

  // 1. Fetch live 2026 data context using the Web Search integration
  const searchPromises = currentOems.map((oem) =>
    performWebSearch(`latest 2025 2026 OEM CSR update requirements official "${oem}" IATF 16949`)
      .then((res) => ({ oem, data: res }))
      .catch(() => ({ oem, data: '' }))
  )
  const searchResults = await Promise.all(searchPromises)
  const liveContextText = searchResults
    .filter((res) => res.data)
    .map((res) => `--- SEARCH RESULTS FOR ${res.oem}: ---\n${res.data}\n`)
    .join('\n')

  const userPrompt = `Review the current CSR database and identify any known updates, changes, or new requirements.

SELECTED OEMs: ${currentOems.join(', ')}

CURRENT DATABASE SUMMARY (${existingSummary.length} records):
${JSON.stringify(existingSummary.slice(0, 50), null, 2)}
${existingSummary.length > 50 ? `... and ${existingSummary.length - 50} more records` : ''}

Based on your knowledge, report:

1. **New or updated CSR requirements** that are NOT in our current database or have newer versions
2. **IATF Sanctioned Interpretations (SIs)** that affect requirements
3. **OEM CSR document changes** (new versions, revised requirements)

For each update, include:
- The exact IATF chapter reference
- Whether it's a new requirement, an update to an existing one, or a deletion
- The source document and version
- A confidence level (high/medium/low) indicating how certain you are
- The effective date if known

LIVE UPDATES CONTEXT (EXTRACTED FROM 2026 WEB SEARCH):
${liveContextText || '(No live search context available, rely on your internal knowledge)'}

IMPORTANT INSTRUCTION FOR THIS REQUEST:
You MUST heavily prioritize the "LIVE UPDATES CONTEXT" above. It contains up-to-date data for 2025 and 2026. Use it to overcome your base knowledge cutoff. If the search context mentions a specific version, date, or requirement, treat that as ground truth fact.

Respond in ${language === 'de' ? 'German' : 'English'} for text fields.

Return JSON:
{
  "updates": [
    {
      "id": "UPDATE-xxx",
      "iatfChapter": "8.5.1.1",
      "title": "Short title",
      "oem": "BMW" or null for IATF base,
      "text": "Full requirement text",
      "version": "CSR v5.0 (2025)",
      "changeStatus": "new|updated|deleted",
      "risk": "low|medium|high|critical",
      "severity": "supplementary|tightening|replacing" or null,
      "sourceDoc": "Document name",
      "effectiveDate": "2025-01-01",
      "confidence": "high|medium|low",
      "notes": "What changed and why"
    }
  ],
  "sanctionedInterpretations": [
    {
      "siNumber": "SI 2024-001",
      "iatfChapter": "8.7.1",
      "summary": "What the SI changes",
      "effectiveDate": "2024-06-01"
    }
  ],
  "oemChanges": [
    {
      "oem": "BMW",
      "documentName": "BMW Group CSR v5.0",
      "version": "5.0",
      "summary": "Key changes in this version",
      "effectiveDate": "2025-01-01"
    }
  ],
  "lastKnownUpdate": "2025-06-01",
  "disclaimer": "Note about verification needed"
}`

  const raw = await ai.complete(
    [{ role: 'user', content: userPrompt }],
    DATA_REFRESH_SYSTEM_PROMPT,
    { maxTokens: 2048, temperature: 0.2, useWebSearch: true },
  )

  let result: DataRefreshResult
  try {
    result = JSON.parse(extractJSON(raw)) as DataRefreshResult
  } catch {
    console.error('[CSR AI] Failed to parse refresh response')
    return {
      updates: [],
      sanctionedInterpretations: [],
      oemChanges: [],
      lastKnownUpdate: new Date().toISOString().slice(0, 10),
      disclaimer: 'AI response could not be parsed. Please try again.',
    }
  }

  if (!result.updates) result.updates = []
  if (!result.sanctionedInterpretations) result.sanctionedInterpretations = []
  if (!result.oemChanges) result.oemChanges = []

  return result
}

// ─── Convert AI Updates to CsrRequirement Format ─────────────────────────────

export function convertUpdatesToCsrRequirements(
  updates: CsrUpdateEntry[],
): CsrRequirement[] {
  return updates
    .filter((u) => u.confidence !== 'low' && u.changeStatus !== 'deleted')
    .map((u) => ({
      id: u.id,
      iatfChapter: u.iatfChapter,
      title: u.title,
      oem: u.oem,
      text: u.text,
      version: u.version,
      changeStatus: u.changeStatus as ChangeStatus,
      risk: u.risk,
      severity: u.severity,
      sourceDoc: u.sourceDoc,
      conflictFlag: false,
      active: true,
      lastUpdated: u.effectiveDate,
      overIatfFlag: u.oem !== null,
    }))
}
