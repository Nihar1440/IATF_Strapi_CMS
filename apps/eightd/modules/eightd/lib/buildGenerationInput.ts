/**
 * Utility to build the GenerationInput object from report data.
 *
 * Previously duplicated identically in Step2Form (L80-102) and Step4Form (L209-231).
 * Single canonical source ensures consistency.
 */

import type { Metadata, D1Team, D2Problem } from '../types/report'
import type { GenerationInput } from '../types/ai'
import { buildActionContextForAI } from './ontology/causeToActionLibrary'

function clampText(value: string, maxLen: number): string {
  const text = value.trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}...`
}

function extractOntologyKeywords(metadata: Metadata, d2: D2Problem): string[] {
  const corpus = [
    metadata.productName,
    d2.what,
    d2.where,
    d2.detectionMethod,
    d2.customerComplaintText,
    d2.additionalNotes,
  ]
    .join(' ')
    .toLowerCase()

  const domainKeywords = [
    'parameter',
    'tool',
    'wear',
    'material',
    'batch',
    'setup',
    'changeover',
    'measurement',
    'gauge',
    'calibration',
    'inspection',
    'control plan',
    'fmea',
    'work instruction',
    'training',
    'complaint',
    'maintenance',
    'supplier',
    'traceability',
    'segregation',
    'escalation',
  ]

  return domainKeywords.filter((keyword) => corpus.includes(keyword))
}

export function buildGenerationInput(
  metadata: Metadata,
  d1: D1Team,
  d2: D2Problem,
): GenerationInput {
  const ontologyKeywords = extractOntologyKeywords(metadata, d2)
  const ontologyActionContextRaw =
    ontologyKeywords.length > 0 ? buildActionContextForAI(ontologyKeywords) : ''
  const ontologyActionContext =
    ontologyActionContextRaw.length > 2_500
      ? `${ontologyActionContextRaw.slice(0, 2_500)}\n... (truncated for request size)`
      : ontologyActionContextRaw

  return {
    metadata: {
      customer: clampText(metadata.customer, 120),
      supplier: clampText(metadata.supplier, 120),
      productName: clampText(metadata.productName, 180),
      partNumber: clampText(metadata.partNumber, 80),
    },
    d1: {
      teamLeader: clampText(d1.teamLeader, 120),
      qualityRep: clampText(d1.qualityRep, 120),
      productionRep: clampText(d1.productionRep, 120),
      engineeringRep: clampText(d1.engineeringRep, 120),
    },
    d2: {
      what: clampText(d2.what, 1200),
      where: clampText(d2.where, 500),
      when: clampText(d2.when, 500),
      howMany: clampText(d2.howMany, 300),
      detectionMethod: clampText(d2.detectionMethod, 500),
      customerComplaintText: clampText(d2.customerComplaintText, 1200),
      additionalNotes: clampText(d2.additionalNotes, 1000),
    },
    ontologyActionContext: ontologyActionContext || undefined,
  }
}
