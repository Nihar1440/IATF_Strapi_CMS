/**
 * AI Input/Output Types for the 8D Generator
 *
 * Based on VDA 8D methodology with TUA/TUN/SUA/SUN root cause categories.
 */

import type { z } from 'zod'
import type {
  assistResultSchema,
  sufficiencyResultSchema,
  generationResultSchema,
  generationD3D4ResultSchema,
  generationD5ResultSchema,
  generationD6ResultSchema,
  generationD7ResultSchema,
  consistencyResultSchema,
  chainCompletionResultSchema,
  rootCauseBackfillResultSchema,
  complaintExtractionResultSchema,
  textTranslationResultSchema,
  sufficiencyFieldSchema,
} from '../schemas/aiSchemas'
import type { CauseType, CauseDomain } from '../lib/ontology'
import type { ReportData } from './report'

// ─── AI Call Types ────────────────────────────────────────────────────────────

export type AICallType =
  | 'assist'
  | 'sufficiency'
  | 'generation'
  | 'generation-d3d4'
  | 'generation-d5'
  | 'generation-d6'
  | 'generation-d7'
  | 'consistency'
  | 'chainCompletion'
  | 'rootCauseBackfill'
  | 'complaintExtraction'
  | 'textTranslation'
  | 'reportTranslation'

// ─── AI Call: D1/D2 Assist ───────────────────────────────────────────────────

export type AssistResult = z.infer<typeof assistResultSchema>

export interface AssistInput {
  fieldName: string
  fieldValue: string
  context: Record<string, string>
}

// ─── AI Call: Complaint Extraction ───────────────────────────────────────────

export type ComplaintExtractionResult = z.infer<typeof complaintExtractionResultSchema>

export interface ComplaintExtractionInput {
  customerComplaintText: string
}

// ─── AI Call: Text Translation ───────────────────────────────────────────────

export type TextTranslationResult = z.infer<typeof textTranslationResultSchema>

export interface TextTranslationInput {
  text: string
  targetLanguage: 'en' | 'de'
}

// ─── AI Call: Full Report Translation ────────────────────────────────────────

export type ReportTranslationResult = ReportData

export interface ReportTranslationInput {
  report: ReportData
  targetLanguage: 'en' | 'de'
}

// ─── AI Call: Sufficiency Check ──────────────────────────────────────────────

export type SufficiencyResult = z.infer<typeof sufficiencyResultSchema>
export type SufficiencyField = z.infer<typeof sufficiencyFieldSchema>

export interface SufficiencyInput {
  d1: {
    teamLeader: string
    qualityRep: string
    productionRep: string
    engineeringRep: string
    additionalMembers: string
  }
  d2: {
    what: string
    where: string
    when: string
    howMany: string
    detectionMethod: string
    whyProblem: string
    customerComplaintText: string
    additionalNotes: string
  }
}

// ─── IS / IS NOT Analysis ────────────────────────────────────────────────────

export interface IsIsNotAnalysis {
  is: string[]
  isNot: string[]
}

// ─── D2 Problem Description (AI Enhanced) ────────────────────────────────────

export interface D2ProblemAI {
  /** WHAT is the problem? */
  what: string
  /** WHERE does the problem occur? */
  where: string
  /** HOW does the problem appear? */
  how: string
  /** WHEN does the problem occur? */
  when: string
  /** WHY is it a problem for the customer? */
  whyProblem: string
  /** Quantitative deviation (numbers, defect rate, quantity) */
  quantitativeDeviation: string
  /** Qualitative description (defect appearance) */
  qualitativeDescription: string
  /** Impact on customer or production */
  customerImpact: string
  /** IS / IS NOT Analysis */
  isIsNotAnalysis: IsIsNotAnalysis
}

// ─── D3 Containment Action (VDA 8D Structure) ────────────────────────────────

export interface D3ContainmentActionAI {
  id: string
  /** Action description following Verb + Noun grammar */
  action: string
  /** Which production stage this covers */
  scope: 'finished_goods' | 'wip' | 'in_transit' | 'customer_stock' | 'all'
  /** Responsible role (not individual name) */
  responsible: string
  /** Implementation date (ISO format) */
  implementationDate: string
  /** Status */
  status: 'pending' | 'in_progress' | 'completed'
  /** Risk assessment or side effects */
  riskAssessment: string
}

// ─── 5-Why Chain with Ontology Codes ─────────────────────────────────────────

export interface FiveWhyChainAI {
  /** Possible cause statement */
  possibleCause: string
  /** Why 1 - First level cause */
  why1: string
  /** Why 2 - Second level cause */
  why2: string
  /** Why 3 - Third level cause */
  why3: string
  /** Why 4 - Fourth level cause */
  why4: string
  /** Why 5 - Fifth level cause (should lead to systemic cause) */
  why5: string
  /** Root cause identified (describes a condition, not an action) */
  rootCause: string
  /** Root cause code from ontology (e.g., PRM-TUA-001) */
  rootCauseCode?: string
  /** Cause domain from ontology */
  causeDomain?: CauseDomain
}

// ─── D4 Root Cause Analysis (VDA 8D with TUA/TUN/SUA/SUN) ────────────────────

export interface D4RootCauseAI {
  /** Technical cause of occurrence (TUA) - 5 Why chain */
  tua: FiveWhyChainAI
  /** Technical cause of non-detection (TUN) - 5 Why chain */
  tun: FiveWhyChainAI
  /** Systemic cause of occurrence (SUA) - derived from TUA why5 */
  sua: {
    cause: string
    causeCode?: string
    derivedFrom: string // Reference to which technical cause this derives from
  }
  /** Systemic cause of non-detection (SUN) - derived from TUN why5 */
  sun: {
    cause: string
    causeCode?: string
    derivedFrom: string
  }
}

// ─── D5 Corrective Action (VDA 8D with Cause Linkage) ────────────────────────

export interface D5CorrectiveActionAI {
  id: string
  /** Action name following Verb + Noun grammar */
  action: string
  /** Detailed notes about the action */
  notes: string
  /** Which root cause this addresses */
  linkedCauseType: CauseType
  /** Reference to the root cause text */
  linkedCauseText: string
  /** Root cause code from ontology if available */
  linkedCauseCode?: string
  /** Responsible role (not individual name) */
  responsible: string
  /** Target completion date (ISO format) */
  targetDate: string
  /** Verification method */
  verificationMethod: string
  /** Is this action for technical or systemic cause? */
  actionCategory: 'technical' | 'systemic'
}

// ─── AI Call: Full Generation ────────────────────────────────────────────────

export type GenerationResult = z.infer<typeof generationResultSchema>

export interface GenerationInput {
  metadata: {
    customer: string
    supplier: string
    productName: string
    partNumber: string
    batchLotNumber?: string
  }
  d1: {
    teamLeader: string
    qualityRep: string
    productionRep: string
    engineeringRep: string
  }
  d2: {
    what: string
    where: string
    when: string
    howMany: string
    detectionMethod: string
    customerComplaintText: string
    additionalNotes: string
  }
  /** Optional ontology-derived corrective action context for prompt grounding */
  ontologyActionContext?: string
}

// ─── AI Call: Split Generation (Phase 1 — D3+D4) ────────────────────────────

export type GenerationD3D4Result = z.infer<typeof generationD3D4ResultSchema>

// ─── AI Call: Split Generation (Phase 2 — D5) ───────────────────────────────

export type GenerationD5Result = z.infer<typeof generationD5ResultSchema>

export interface GenerationD5Input {
  /** Original D2 context for the D5 prompt */
  d2: GenerationInput['d2']
  /** D4 root causes from Phase 1 — D5 must link corrective actions to these */
  d4: GenerationD3D4Result['d4']
}

// ─── AI Call: Split Generation (Phase 3 — D6) ───────────────────────────────

export type GenerationD6Result = z.infer<typeof generationD6ResultSchema>

export interface GenerationD6Input {
  /** D5 corrective actions — D6 must be derived from these */
  d5Actions: Array<{ action: string; linkedCauseType: string; linkedCauseText: string }>
  /** Root cause context from D4 */
  rootCause: string
}

// ─── AI Call: Split Generation (Phase 4 — D7) ───────────────────────────────

export type GenerationD7Result = z.infer<typeof generationD7ResultSchema>

export interface GenerationD7Input {
  /** D3 containment actions */
  d3Actions: Array<{ action: string }>
  /** D5 corrective actions */
  d5Actions: Array<{ action: string; linkedCauseType: string }>
  /** Root cause context from D4 */
  rootCause: string
  /** Root cause category */
  rootCauseCategory: 'technical' | 'systemic' | 'both'
}

// ─── AI Call: Consistency Check ──────────────────────────────────────────────

export type ConsistencyResult = z.infer<typeof consistencyResultSchema>

export interface ConsistencyInput {
  d2: {
    what: string
    where: string
    when: string
    howMany: string
    how?: string
    whyProblem?: string
    detectionMethod: string
  }
  d3: {
    actions: Array<{
      action: string
      responsible: string
      scope?: string
    }>
  }
  d4: {
    tua: {
      possibleCause: string
      why1: string
      why2: string
      why3: string
      why4: string
      why5: string
      rootCause: string
      rootCauseCode?: string
      causeDomain?: string
    }
    tun: {
      possibleCause: string
      why1: string
      why2: string
      why3: string
      why4: string
      why5: string
      rootCause: string
      rootCauseCode?: string
      causeDomain?: string
    }
    sua: { cause: string; causeCode?: string }
    sun: { cause: string; causeCode?: string }
  }
  d5: {
    actions: Array<{
      action: string
      linkedCauseType: CauseType
      linkedCauseText: string
      responsible: string
      verificationMethod?: string
    }>
  }
}

// ─── AI Call: Chain Completion ───────────────────────────────────────────────

export type ChainCompletionResult = z.infer<typeof chainCompletionResultSchema>

export interface ChainCompletionInput {
  chainType: 'tua' | 'tun'
  whyNumber: number
  currentWhy: string
  context: {
    d2: {
      what: string
      where: string
      when: string
    }
    previousWhys: string[]
  }
}

export type RootCauseBackfillResult = z.infer<typeof rootCauseBackfillResultSchema>

export interface RootCauseBackfillInput {
  chainType: 'tua' | 'tun'
  rootCause: string
  context: {
    d2: {
      what: string
      where: string
      when: string
      howMany: string
      detectionMethod: string
    }
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

export interface AICallContext {
  language: 'en' | 'de'
  retryCount?: number
  previousError?: string
}

// ─── API Request / Response ──────────────────────────────────────────────────

export interface AIApiRequest {
  type: AICallType
  language: 'en' | 'de'
  payload:
    | AssistInput
    | ComplaintExtractionInput
    | SufficiencyInput
    | GenerationInput
    | GenerationD5Input
    | GenerationD6Input
    | GenerationD7Input
    | ConsistencyInput
    | ChainCompletionInput
    | RootCauseBackfillInput
    | TextTranslationInput
    | ReportTranslationInput
}

export interface AIApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
