import type { D2Problem, FiveWhyChain } from '../types/report'
import type { ComplaintExtractionResult } from '../types/ai'

function splitAfterLastQuestion(text: string): string {
  const qIndex = text.lastIndexOf('?')
  if (qIndex === -1 || qIndex >= text.length - 1) return text

  const trailing = text.slice(qIndex + 1).trim().replace(/^[-–—:\s]+/, '')
  return trailing || text
}

export function normalizeWhyAnswer(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const withoutLabel = trimmed.replace(/^(why|warum)\s*\d+\s*[:\-]\s*/i, '')
  return splitAfterLastQuestion(withoutLabel).trim()
}

export function normalizeFiveWhyChain<T extends FiveWhyChain>(chain: T): T {
  return {
    ...chain,
    why1: normalizeWhyAnswer(chain.why1),
    why2: normalizeWhyAnswer(chain.why2),
    why3: normalizeWhyAnswer(chain.why3),
    why4: normalizeWhyAnswer(chain.why4),
    why5: normalizeWhyAnswer(chain.why5),
  }
}

function normalizeComparableText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
}

function pickDistinctValue(
  candidate: string,
  fallback: string,
  disallowed: string[],
): string {
  const trimmed = candidate.trim()
  if (!trimmed) return fallback

  const normalized = normalizeComparableText(trimmed)
  if (!normalized) return fallback

  const conflicts = disallowed.some((value) => normalizeComparableText(value) === normalized)
  return conflicts ? fallback : trimmed
}

export function applyComplaintExtraction(
  current: D2Problem,
  extracted: ComplaintExtractionResult,
): D2Problem {
  const nextWhat = pickDistinctValue(extracted.what, current.what, [])
  const nextWhere = pickDistinctValue(extracted.where, current.where, [nextWhat])
  const nextWhen = pickDistinctValue(extracted.when, current.when, [nextWhat, nextWhere])
  const nextHowMany = pickDistinctValue(
    extracted.howMany,
    current.howMany,
    [nextWhat, nextWhere, nextWhen],
  )
  const nextDetectionMethod = pickDistinctValue(
    extracted.detectionMethod,
    current.detectionMethod,
    [nextWhat, nextWhere, nextWhen, nextHowMany],
  )
  const nextHow = pickDistinctValue(
    extracted.how,
    current.how,
    [nextWhat, nextWhere, nextWhen, nextHowMany, nextDetectionMethod],
  )
  const nextWhyProblem = pickDistinctValue(
    extracted.whyProblem,
    current.whyProblem,
    [nextWhat, nextWhere, nextWhen, nextHowMany, nextDetectionMethod, nextHow],
  )
  const nextQuantitativeDeviation = pickDistinctValue(
    extracted.quantitativeDeviation,
    current.quantitativeDeviation,
    [nextHowMany],
  )
  const nextQualitativeDescription = pickDistinctValue(
    extracted.qualitativeDescription,
    current.qualitativeDescription,
    [nextWhat, nextHow],
  )
  const nextCustomerImpact = pickDistinctValue(
    extracted.customerImpact,
    current.customerImpact,
    [nextWhyProblem],
  )

  return {
    ...current,
    what: nextWhat,
    where: nextWhere,
    when: nextWhen,
    howMany: nextHowMany,
    detectionMethod: nextDetectionMethod,
    how: nextHow,
    whyProblem: nextWhyProblem,
    quantitativeDeviation: nextQuantitativeDeviation,
    qualitativeDescription: nextQualitativeDescription,
    customerImpact: nextCustomerImpact,
    isAnalysis: {
      what: {
        ...current.isAnalysis.what,
        is: pickDistinctValue(
          extracted.isAnalysis.what,
          current.isAnalysis.what.is,
          [nextWhat],
        ),
      },
      where: {
        ...current.isAnalysis.where,
        is: pickDistinctValue(
          extracted.isAnalysis.where,
          current.isAnalysis.where.is,
          [nextWhere],
        ),
      },
      when: {
        ...current.isAnalysis.when,
        is: pickDistinctValue(
          extracted.isAnalysis.when,
          current.isAnalysis.when.is,
          [nextWhen],
        ),
      },
      howMany: {
        ...current.isAnalysis.howMany,
        is: pickDistinctValue(
          extracted.isAnalysis.howMany,
          current.isAnalysis.howMany.is,
          [nextHowMany],
        ),
      },
    },
    isNotAnalysis: {
      what: {
        ...current.isNotAnalysis.what,
        isNot: pickDistinctValue(
          extracted.isNotAnalysis.what,
          current.isNotAnalysis.what.isNot,
          [],
        ),
      },
      where: {
        ...current.isNotAnalysis.where,
        isNot: pickDistinctValue(
          extracted.isNotAnalysis.where,
          current.isNotAnalysis.where.isNot,
          [],
        ),
      },
      when: {
        ...current.isNotAnalysis.when,
        isNot: pickDistinctValue(
          extracted.isNotAnalysis.when,
          current.isNotAnalysis.when.isNot,
          [],
        ),
      },
      howMany: {
        ...current.isNotAnalysis.howMany,
        isNot: pickDistinctValue(
          extracted.isNotAnalysis.howMany,
          current.isNotAnalysis.howMany.isNot,
          [],
        ),
      },
    },
  }
}
