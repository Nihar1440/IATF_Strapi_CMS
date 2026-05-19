import { z } from 'zod'

// ─── AI Output: D1/D2 Assist ─────────────────────────────────────────────────

export const assistResultSchema = z.object({
  improved: z.string(),
  missingFields: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ─── AI Output: Complaint Extraction ─────────────────────────────────────────

const complaintIsIsNotSchema = z.object({
  what: z.string(),
  where: z.string(),
  when: z.string(),
  howMany: z.string(),
})

export const complaintExtractionResultSchema = z.object({
  what: z.string(),
  where: z.string(),
  when: z.string(),
  howMany: z.string(),
  detectionMethod: z.string(),
  how: z.string(),
  whyProblem: z.string(),
  quantitativeDeviation: z.string(),
  qualitativeDescription: z.string(),
  customerImpact: z.string(),
  isAnalysis: complaintIsIsNotSchema,
  isNotAnalysis: complaintIsIsNotSchema,
})

// ─── AI Output: Text Translation ─────────────────────────────────────────────

export const textTranslationResultSchema = z.object({
  translatedText: z.string(),
})

// ─── AI Output: Sufficiency Check ────────────────────────────────────────────

export const sufficiencyFieldSchema = z.enum([
  'what',
  'where',
  'when',
  'howMany',
  'detectionMethod',
  'whyProblem',
  'customerComplaintText',
])

export const sufficiencyIssueSchema = z.object({
  field: sufficiencyFieldSchema,
  message: z.string(),
})

export const sufficiencyResultSchema = z.object({
  sufficient: z.boolean(),
  issues: z.array(sufficiencyIssueSchema).max(3),
})

// ─── IS / IS NOT Analysis Schema ─────────────────────────────────────────────

export const isIsNotAnalysisSchema = z.object({
  is: z.array(z.string()),
  isNot: z.array(z.string()),
})

// ─── AI Output: D2 Problem Description (Enhanced) ────────────────────────────

export const d2ProblemAISchema = z.object({
  what: z.string(),
  where: z.string(),
  how: z.string(),
  when: z.string(),
  whyProblem: z.string(),
  quantitativeDeviation: z.string(),
  qualitativeDescription: z.string(),
  customerImpact: z.string(),
  isIsNotAnalysis: isIsNotAnalysisSchema,
})

// ─── D3 Containment Action Schema (VDA 8D) ───────────────────────────────────

export const containmentScopeEnum = z.enum([
  'finished_goods',
  'wip',
  'in_transit',
  'customer_stock',
  'all',
])

export const aiContainmentActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  scope: containmentScopeEnum,
  responsible: z.string(),
  implementationDate: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  riskAssessment: z.string(),
})

// ─── 5-Why Chain Schema (with Ontology Support) ──────────────────────────────

export const fiveWhyChainSchema = z.object({
  possibleCause: z.string(),
  why1: z.string(),
  why2: z.string(),
  why3: z.string(),
  why4: z.string(),
  why5: z.string(),
  rootCause: z.string(),
  rootCauseCode: z.string().optional(),
  causeDomain: z.string().optional(),
})

// ─── Systemic Cause Schema ───────────────────────────────────────────────────

export const systemicCauseSchema = z.object({
  cause: z.string(),
  causeCode: z.string().optional(),
  derivedFrom: z.string(),
})

// ─── D4 Root Cause Analysis Schema (VDA 8D with TUA/TUN/SUA/SUN) ─────────────

export const d4RootCauseAISchema = z.object({
  tua: fiveWhyChainSchema,
  tun: fiveWhyChainSchema,
  sua: systemicCauseSchema,
  sun: systemicCauseSchema,
})

// ─── Cause Type Enum ─────────────────────────────────────────────────────────

export const causeTypeEnum = z.enum(['TUA', 'TUN', 'SUA', 'SUN'])

// ─── D5 Corrective Action Schema (VDA 8D) ────────────────────────────────────

export const aiCorrectiveActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  notes: z.string(),
  linkedCauseType: causeTypeEnum,
  linkedCauseText: z.string(),
  linkedCauseCode: z.string().optional(),
  responsible: z.string(),
  targetDate: z.string(),
  verificationMethod: z.string(),
  actionCategory: z.enum(['technical', 'systemic']),
})

// ─── AI Output: Full Generation (legacy — kept for cache compatibility) ──────

export const generationResultSchema = z.object({
  d2Enhanced: d2ProblemAISchema.optional(),
  d3: z.object({
    actions: z.array(aiContainmentActionSchema).min(1).max(6),
  }),
  d4: d4RootCauseAISchema,
  d5: z.object({
    actions: z.array(aiCorrectiveActionSchema).min(1),
  }),
}).refine(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any) => {
    const causeMap: Record<string, string> = {
      TUA: data.d4.tua.rootCause,
      TUN: data.d4.tun.rootCause,
      SUA: data.d4.sua.cause,
      SUN: data.d4.sun.cause,
    }
    for (const action of data.d5.actions) {
      const expected = causeMap[action.linkedCauseType]
      if (!expected) return false
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      if (norm(action.linkedCauseText) !== norm(expected)) return false
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coveredTypes = new Set(data.d5.actions.map((a: any) => a.linkedCauseType))
    return ['TUA', 'TUN', 'SUA', 'SUN'].every((t) => coveredTypes.has(t as z.infer<typeof causeTypeEnum>))
  },
  {
    message:
      'D5 corrective actions must cover all 4 root cause types (TUA, TUN, SUA, SUN) and each action\'s linkedCauseText must exactly match the root cause text from D4. ' +
      'For TUA/TUN actions, use the rootCause field. For SUA/SUN actions, use the cause field. ' +
      'Ensure linkedCauseType correctly identifies which D4 root cause the action addresses.',
  },
)

// ─── AI Output: Phase 1 — D3 + D4 (split generation) ────────────────────────

export const generationD3D4ResultSchema = z.object({
  d2Enhanced: d2ProblemAISchema.optional(),
  d3: z.object({
    actions: z.array(aiContainmentActionSchema).min(1).max(6),
  }),
  d4: d4RootCauseAISchema,
})

// ─── AI Output: Phase 2 — D5 (split generation) ─────────────────────────────

export const generationD5ResultSchema = z.object({
  d5: z.object({
    actions: z.array(aiCorrectiveActionSchema).min(1),
  }),
})

// ─── AI Output: Phase 3 — D6 (implementation & verification) ────────────────

export const aiD6ItemSchema = z.object({
  action: z.string(),
  implementation: z.string(),
  verification: z.string(),
})

export const generationD6ResultSchema = z.object({
  d6: z.array(aiD6ItemSchema).min(1),
})

// ─── AI Output: Phase 4 — D7 (prevent recurrence) ──────────────────────────

export const aiD7ItemSchema = z.object({
  action: z.string(),
  scope: z.string(),
  type: z.literal('systemic prevention'),
})

export const generationD7ResultSchema = z.object({
  d7: z.array(aiD7ItemSchema).min(1).max(5),
})

// ─── AI Output: Consistency Check ────────────────────────────────────────────

export const consistencyResultSchema = z.object({
  consistent: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  grammarViolations: z.array(z.string()).optional(),
  vagueWording: z.array(z.string()).optional(),
  blameStatements: z.array(z.string()).optional(),
  causeActionMismatches: z.array(z.string()).optional(),
})

// ─── AI Output: Chain Completion ─────────────────────────────────────────────

export const chainCompletionResultSchema = z.object({
  improvedCurrentWhy: z.string(),
  subsequentWhys: z.array(z.string()).min(0).max(4),
  rootCause: z.string()
})

export const rootCauseBackfillResultSchema = z.object({
  possibleCause: z.string(),
  why1: z.string(),
  why2: z.string(),
  why3: z.string(),
  why4: z.string(),
  why5: z.string(),
  rootCause: z.string(),
})
