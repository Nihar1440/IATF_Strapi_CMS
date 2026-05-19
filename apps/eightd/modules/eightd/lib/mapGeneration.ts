/**
 * Maps an AI GenerationResult to the form data shapes used by D3, D4, and D5.
 *
 * This was previously duplicated in Step2Form (×2) and Step4Form.
 * A single canonical mapping ensures consistency and simplifies maintenance.
 */

import type { D3Containment, D4RootCause, D5Actions } from '../types/report'
import type { GenerationResult, GenerationD5Result } from '../types/ai'
import { normalizeFiveWhyChain } from './aiTransforms'

export interface MappedGeneration {
  d3: D3Containment
  d4: D4RootCause
  d5: D5Actions
}

/**
 * Compute complaint date + 1 day as ISO string (YYYY-MM-DD).
 * Used for D3 containment due dates (24-hour response requirement).
 */
function getNextDay(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/** Map a 5-Why chain from AI output to the form's FiveWhyChain shape. */
function mapFiveWhy(chain: GenerationResult['d4']['tua']) {
  return normalizeFiveWhyChain({
    why1: chain.why1,
    why2: chain.why2,
    why3: chain.why3,
    why4: chain.why4,
    why5: chain.why5,
    rootCause: chain.rootCause,
    possibleCause: chain.possibleCause,
    rootCauseCode: chain.rootCauseCode ?? '',
    causeDomain: chain.causeDomain ?? '',
  })
}

/** Map a systemic cause from AI output to the form's SystemicCause shape. */
function mapSystemic(sc: GenerationResult['d4']['sua']) {
  return {
    cause: sc.cause,
    causeCode: sc.causeCode ?? '',
    derivedFrom: sc.derivedFrom,
  }
}

export interface MapGenerationOptions {
  /** Complaint date (ISO YYYY-MM-DD) — used to default D3 due dates to +1 day */
  complaintDate?: string
}

/** Map phase-2 D5-only AI output to the form's D5 structure. */
export function mapGenerationD5ToFormData(gen: GenerationD5Result): D5Actions {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions: gen.d5.actions.map((a: any) => ({
      id: a.id,
      action: a.action + (a.notes ? ` — ${a.notes}` : ''),
      relatedRootCause: a.linkedCauseText,
      linkedCauseType: a.linkedCauseType,
      linkedCauseCode: a.linkedCauseCode ?? '',
      actionCategory: a.actionCategory,
      responsible: a.responsible,
      targetDate: a.targetDate,
      verificationMethod: a.verificationMethod,
      notes: a.notes,
    })),
    plannedVerification: '',
  }
}

/**
 * Convert a full AI `GenerationResult` into the report form structures.
 *
 * The AI returns uppercase `CauseType` values (TUA/TUN/SUA/SUN) which are
 * normalised to lowercase here to match the form's `CauseType` type.
 */
export function mapGenerationToFormData(
  gen: GenerationResult,
  options?: MapGenerationOptions,
): MappedGeneration {
  const defaultDueDate = options?.complaintDate
    ? getNextDay(options.complaintDate)
    : ''

  const d3: D3Containment = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions: gen.d3.actions.map((a: any) => ({
      id: a.id,
      action: a.action,
      responsible: a.responsible,
      dueDate: defaultDueDate || a.implementationDate,
      effectiveness: '',
      scope: a.scope,
      riskAssessment: a.riskAssessment,
      notes: '',
    })),
    cleanpointDeliveryOn: '',
    deliveryNoteNumber: '',
    deliveredOn: '',
    quantityCorrect: '',
    quantityIncorrect: '',
    effectivenessVerification: '',
  }

  const d4: D4RootCause = {
    tua: mapFiveWhy(gen.d4.tua),
    tun: mapFiveWhy(gen.d4.tun),
    sua: mapSystemic(gen.d4.sua),
    sun: mapSystemic(gen.d4.sun),
  }

  const d5: D5Actions = {
    ...mapGenerationD5ToFormData({ d5: gen.d5 }),
  }

  return { d3, d4, d5 }
}
