import { aiProvider, extractJSON } from '../../../lib/ai/provider'
import type { ConflictInfo, OemId } from '../types'

/**
 * Uses the configured AI Provider (OpenAI/Anthropic/Gemini) to evaluate an array of conflicts
 * and determine the strictest requirement for each conflict based on automotive quality engineering principles.
 */
export async function evaluateConflictsWithAi(
  conflicts: ConflictInfo[],
  language: 'en' | 'de' = 'en'
): Promise<void> {
  if (!conflicts || conflicts.length === 0) return

  const promptStr = `You are an expert Automotive Quality Engineer evaluating Customer Specific Requirements (CSRs).
You are given a JSON array of conflict objects. For each conflict, you must determine which OEM has the STRICTEST requirement.

Rules for "strictest":
1. Deadlines: Shorter is stricter (e.g. 5 business days is stricter than 14 calendar days).
2. Capability Limits: Stricter statistical limits (e.g. Cpk 1.67 > 1.33).
3. Mandatory Precedence: "must/shall" is stricter than "should", which is stricter than "may/optional".
4. If they cannot be compared structurally, return "Manual review required" as the recommendation.

Respond ONLY with a valid JSON array of objects, one for each conflict provided. Do not use markdown blocks if it breaks parsing, just standard JSON.
Each object MUST have the following structure:
{
  "iatfChapter": "The chapter ID (e.g. 10.2.3)",
  "strictestOem": "The OEM ID that is strictest (e.g. VOLVO) or null if manual review is needed",
  "decision": "A short, actionable recommendation string (e.g. 'Recommendation: Apply Volvo requirement' or 'Empfehlung: Volvo-Anforderung anwenden')",
  "reason": "A concise explanation of WHY it is stricter (e.g. 'Shortest normalized deadline (5 business days ≈ 7 calendar days)')"
}

Language preference for 'recommendation' and 'reason': ${language === 'de' ? 'GERMAN (Deutsch)' : 'ENGLISH'}
`

  // Build the payload
  const payload = conflicts.map(c => ({
    iatfChapter: c.iatfChapter,
    oems: c.oems,
    description: c.description,
    rawRequirements: c.evaluatedRequirements?.map(r => ({
      oem: r.oem,
      text: r.rawText
    })) || []
  }))

  try {
    const rawResponse = await aiProvider.instance.complete(
      [{ role: 'user', content: JSON.stringify(payload) }],
      promptStr,
      { temperature: 0.1 } // Low temperature for deterministic/analytical output
    )

    const jsonStr = extractJSON(rawResponse)
    const results = JSON.parse(jsonStr) as Array<{
      iatfChapter: string,
      strictestOem: OemId | null,
      decision: string,
      reason: string
    }>

    // Map the results back to the original conflicts array
    for (const conflict of conflicts) {
      const match = results.find(r => r.iatfChapter === conflict.iatfChapter)
      if (match) {
        conflict.strictestOem = match.strictestOem || undefined
        conflict.decision = match.decision
        conflict.reason = match.reason
      }
    }
  } catch (error) {
    console.error('[ConflictEngine] AI Evaluation failed:', error)
    // Fallback to manual review if AI fails
    for (const conflict of conflicts) {
      conflict.decision = language === 'de' ? 'Manuelle Überprüfung erforderlich (KI-Fehler)' : 'Manual review required (AI Error)'
      conflict.reason = language === 'de' ? 'Die KI konnte den Konflikt nicht analysieren.' : 'The AI failed to analyze this conflict.'
    }
  }
}

// Retain ParsedRequirement type for `types/matrix.ts` compatibility
export type MetricType = "deadline" | "limit" | "mandatory" | "unstructured";
export type TimeUnit = "calendar_days" | "business_days" | "hours";

export interface ParsedRequirement {
  oem: string;
  metricType?: MetricType;
  value?: number;
  unit?: TimeUnit;
  rawText: string;
}
