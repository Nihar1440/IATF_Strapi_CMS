import { z } from 'zod'
import { getAIProvider, extractJSON } from '@/lib/ai/provider'

import type { ConfidenceLevel, FmeaIssue, FmeaRow } from '@/modules/fmea/types'

type IssueWithRow = FmeaIssue & { row_id: string }

type FmeaAiFinding = {
  row_id: string
  ruleId: string
  title: string
  explanation: string
  recommended_action: string
  confidence: ConfidenceLevel
}

const aiFindingSchema = z.object({
  row_id: z.string(),
  ruleId: z.string(),
  title: z.string().min(1).max(120),
  explanation: z.string().min(1).max(600),
  recommended_action: z.string().min(1).max(600),
  confidence: z.enum(['High', 'Medium', 'Low']).default('Medium'),
})

const aiFindingsSchema = z.array(aiFindingSchema).max(12)

function deterministicFinding(issue: IssueWithRow, row?: FmeaRow): FmeaAiFinding {
  return {
    row_id: issue.row_id,
    ruleId: issue.ruleId,
    title: `${issue.ruleId}: ${issue.field}`,
    explanation: row
      ? `${issue.message} Review source row ${row.source_reference.row} (${row.failure_mode || 'failure mode not provided'}).`
      : issue.message,
    recommended_action: issue.suggested_value
      ? `Update ${issue.field} to ${issue.suggested_value} or document the engineering rationale.`
      : `Review and complete ${issue.field}, then confirm the FMEA row against AIAG/VDA expectations.`,
    confidence: issue.confidence,
  }
}

export async function generateFmeaAiFindings(
  rows: FmeaRow[],
  issues: IssueWithRow[],
  language: 'de' | 'en',
): Promise<FmeaAiFinding[]> {
  const priorityIssues = [...issues]
    .sort((a, b) => {
      const rank = { Critical: 3, High: 2, Medium: 1 }
      return rank[b.severity] - rank[a.severity]
    })
    .slice(0, 12)

  if (priorityIssues.length === 0) return []

  const fallback = priorityIssues.map((issue) =>
    deterministicFinding(issue, rows.find((row) => row.id === issue.row_id)),
  )

  const issuePayload = priorityIssues.map((issue) => {
    const row = rows.find((candidate) => candidate.id === issue.row_id)
    return {
      issue,
      row: row
        ? {
            row_id: row.id,
            source_row: row.source_reference.row,
            failure_mode: row.failure_mode,
            failure_effect: row.failure_effect,
            failure_cause: row.failure_cause,
            sod: `${row.severity}/${row.occurrence}/${row.detection}`,
            current_ap: row.ap_current,
            action_recommended: row.action_recommended,
            responsible: row.responsible,
            target_date: row.target_date,
          }
        : null,
    }
  })

  try {
    const ai = getAIProvider()

    const systemPrompt = [
      'You are an AIAG/VDA FMEA review assistant for automotive quality engineers.',
      'Create concise, audit-safe review findings from deterministic validation issues.',
      'Do not invent source data. Do not override the deterministic AP calculation.',
      'Return only JSON: an array of objects with row_id, ruleId, title, explanation, recommended_action, confidence.',
      'Use confidence High, Medium, or Low.',
      language === 'de' ? 'Write German output.' : 'Write English output.',
    ].join('\n')

    const raw = await ai.complete(
      [
        {
          role: 'user',
          content: JSON.stringify({ issues: issuePayload }, null, 2),
        },
      ],
      systemPrompt,
      { maxTokens: 2400, temperature: 0.1 },
    )

    const parsed = aiFindingsSchema.safeParse(JSON.parse(extractJSON(raw)))
    if (!parsed.success || parsed.data.length === 0) {
      console.error('[FMEA AI Findings] No valid findings parsed from response, using deterministic fallback')
      return fallback
    }

    return parsed.data
  } catch (err) {
    console.error('[FMEA AI Findings] Falling back to deterministic findings:', err instanceof Error ? err.message : err)
    console.error('[FMEA AI Findings] Processed', priorityIssues.length, 'priority issues')
    return fallback
  }
}
