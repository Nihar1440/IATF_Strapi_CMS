import type { ReportTranslationInput, ReportTranslationResult } from '../types/ai'
import type { ReportData } from '../types/report'
import { callAIWithRetry } from './aiService'
import { z } from 'zod'

// ─── Text extraction / merge helpers ─────────────────────────────────────────

/**
 * Extract only non-empty free-text fields from the report into a flat
 * Record<string, string>.  Structural data (IDs, dates, enums, codes,
 * part-numbers, names) is intentionally skipped.
 */
function extractTexts(report: ReportData): Record<string, string> {
  const t: Record<string, string> = {}
  const add = (k: string, v: string | undefined) => {
    if (v?.trim()) t[k] = v
  }

  // D1
  add('d1.additionalMembers', report.d1.additionalMembers)

  // metadata
  add('m.symptomDescription', report.metadata.symptomDescription)

  // D2
  const d2 = report.d2
  add('d2.what', d2.what)
  add('d2.where', d2.where)
  add('d2.when', d2.when)
  add('d2.howMany', d2.howMany)
  add('d2.how', d2.how)
  add('d2.whyProblem', d2.whyProblem)
  add('d2.detectionMethod', d2.detectionMethod)
  add('d2.customerComplaintText', d2.customerComplaintText)
  add('d2.quantitativeDeviation', d2.quantitativeDeviation)
  add('d2.qualitativeDescription', d2.qualitativeDescription)
  add('d2.customerImpact', d2.customerImpact)
  add('d2.is.what.is', d2.isAnalysis.what.is)
  add('d2.is.what.isNot', d2.isAnalysis.what.isNot)
  add('d2.is.where.is', d2.isAnalysis.where.is)
  add('d2.is.where.isNot', d2.isAnalysis.where.isNot)
  add('d2.is.when.is', d2.isAnalysis.when.is)
  add('d2.is.when.isNot', d2.isAnalysis.when.isNot)
  add('d2.is.howMany.is', d2.isAnalysis.howMany.is)
  add('d2.is.howMany.isNot', d2.isAnalysis.howMany.isNot)
  add('d2.isNot.what.is', d2.isNotAnalysis.what.is)
  add('d2.isNot.what.isNot', d2.isNotAnalysis.what.isNot)
  add('d2.isNot.where.is', d2.isNotAnalysis.where.is)
  add('d2.isNot.where.isNot', d2.isNotAnalysis.where.isNot)
  add('d2.isNot.when.is', d2.isNotAnalysis.when.is)
  add('d2.isNot.when.isNot', d2.isNotAnalysis.when.isNot)
  add('d2.isNot.howMany.is', d2.isNotAnalysis.howMany.is)
  add('d2.isNot.howMany.isNot', d2.isNotAnalysis.howMany.isNot)
  add('d2.additionalNotes', d2.additionalNotes)

  // D3
  report.d3.actions.forEach((a, i) => {
    add(`d3a${i}.action`, a.action)
    add(`d3a${i}.effectiveness`, a.effectiveness)
    add(`d3a${i}.riskAssessment`, a.riskAssessment)
    add(`d3a${i}.notes`, a.notes)
  })
  add('d3.effectivenessVerification', report.d3.effectivenessVerification)

  // D4
  const d4 = report.d4
  for (const key of ['tua', 'tun'] as const) {
    const chain = d4[key]
    add(`d4.${key}.why1`, chain.why1)
    add(`d4.${key}.why2`, chain.why2)
    add(`d4.${key}.why3`, chain.why3)
    add(`d4.${key}.why4`, chain.why4)
    add(`d4.${key}.why5`, chain.why5)
    add(`d4.${key}.rootCause`, chain.rootCause)
    add(`d4.${key}.possibleCause`, chain.possibleCause)
    add(`d4.${key}.causeDomain`, chain.causeDomain)
  }
  for (const key of ['sua', 'sun'] as const) {
    const sc = d4[key]
    add(`d4.${key}.cause`, sc.cause)
    add(`d4.${key}.derivedFrom`, sc.derivedFrom)
  }

  // D5
  report.d5.actions.forEach((a, i) => {
    add(`d5a${i}.action`, a.action)
    add(`d5a${i}.relatedRootCause`, a.relatedRootCause)
    add(`d5a${i}.verificationMethod`, a.verificationMethod)
    add(`d5a${i}.notes`, a.notes)
  })
  add('d5.plannedVerification', report.d5.plannedVerification)

  // D6
  add('d6.implementationStatus', report.d6.implementationStatus)
  add('d6.verificationResults', report.d6.verificationResults)
  add('d6.containmentRemoved', report.d6.containmentRemoved)

  // D7
  for (const key of ['fmea', 'controlPlan', 'workInstructions', 'testInspectionPlan', 'otherDocuments'] as const) {
    add(`d7.${key}.actionRequired`, report.d7[key].actionRequired)
    add(`d7.${key}.transfer`, report.d7[key].transfer)
  }

  // D8
  add('d8.lessonsLearned', report.d8.lessonsLearned)
  add('d8.teamRecognition', report.d8.teamRecognition)

  return t
}

/**
 * Merge translated texts back into a clone of the original report.
 * Any key missing from the translations keeps the original value.
 */
function mergeTexts(
  report: ReportData,
  texts: Record<string, string>,
  targetLanguage: 'en' | 'de',
): ReportData {
  const g = (k: string, fallback: string) => (k in texts ? texts[k] : fallback)

  const result: ReportData = structuredClone(report)
  result.language = targetLanguage

  // D1
  result.d1.additionalMembers = g('d1.additionalMembers', report.d1.additionalMembers)

  // metadata
  result.metadata.symptomDescription = g('m.symptomDescription', report.metadata.symptomDescription)

  // D2
  result.d2.what = g('d2.what', report.d2.what)
  result.d2.where = g('d2.where', report.d2.where)
  result.d2.when = g('d2.when', report.d2.when)
  result.d2.howMany = g('d2.howMany', report.d2.howMany)
  result.d2.how = g('d2.how', report.d2.how)
  result.d2.whyProblem = g('d2.whyProblem', report.d2.whyProblem)
  result.d2.detectionMethod = g('d2.detectionMethod', report.d2.detectionMethod)
  result.d2.customerComplaintText = g('d2.customerComplaintText', report.d2.customerComplaintText)
  result.d2.quantitativeDeviation = g('d2.quantitativeDeviation', report.d2.quantitativeDeviation)
  result.d2.qualitativeDescription = g('d2.qualitativeDescription', report.d2.qualitativeDescription)
  result.d2.customerImpact = g('d2.customerImpact', report.d2.customerImpact)
  result.d2.isAnalysis.what.is = g('d2.is.what.is', report.d2.isAnalysis.what.is)
  result.d2.isAnalysis.what.isNot = g('d2.is.what.isNot', report.d2.isAnalysis.what.isNot)
  result.d2.isAnalysis.where.is = g('d2.is.where.is', report.d2.isAnalysis.where.is)
  result.d2.isAnalysis.where.isNot = g('d2.is.where.isNot', report.d2.isAnalysis.where.isNot)
  result.d2.isAnalysis.when.is = g('d2.is.when.is', report.d2.isAnalysis.when.is)
  result.d2.isAnalysis.when.isNot = g('d2.is.when.isNot', report.d2.isAnalysis.when.isNot)
  result.d2.isAnalysis.howMany.is = g('d2.is.howMany.is', report.d2.isAnalysis.howMany.is)
  result.d2.isAnalysis.howMany.isNot = g('d2.is.howMany.isNot', report.d2.isAnalysis.howMany.isNot)
  result.d2.isNotAnalysis.what.is = g('d2.isNot.what.is', report.d2.isNotAnalysis.what.is)
  result.d2.isNotAnalysis.what.isNot = g('d2.isNot.what.isNot', report.d2.isNotAnalysis.what.isNot)
  result.d2.isNotAnalysis.where.is = g('d2.isNot.where.is', report.d2.isNotAnalysis.where.is)
  result.d2.isNotAnalysis.where.isNot = g('d2.isNot.where.isNot', report.d2.isNotAnalysis.where.isNot)
  result.d2.isNotAnalysis.when.is = g('d2.isNot.when.is', report.d2.isNotAnalysis.when.is)
  result.d2.isNotAnalysis.when.isNot = g('d2.isNot.when.isNot', report.d2.isNotAnalysis.when.isNot)
  result.d2.isNotAnalysis.howMany.is = g('d2.isNot.howMany.is', report.d2.isNotAnalysis.howMany.is)
  result.d2.isNotAnalysis.howMany.isNot = g('d2.isNot.howMany.isNot', report.d2.isNotAnalysis.howMany.isNot)
  result.d2.additionalNotes = g('d2.additionalNotes', report.d2.additionalNotes)

  // D3
  result.d3.actions.forEach((a, i) => {
    a.action = g(`d3a${i}.action`, a.action)
    a.effectiveness = g(`d3a${i}.effectiveness`, a.effectiveness)
    a.riskAssessment = g(`d3a${i}.riskAssessment`, a.riskAssessment)
    a.notes = g(`d3a${i}.notes`, a.notes)
  })
  result.d3.effectivenessVerification = g('d3.effectivenessVerification', report.d3.effectivenessVerification)

  // D4
  for (const key of ['tua', 'tun'] as const) {
    const chain = result.d4[key]
    chain.why1 = g(`d4.${key}.why1`, chain.why1)
    chain.why2 = g(`d4.${key}.why2`, chain.why2)
    chain.why3 = g(`d4.${key}.why3`, chain.why3)
    chain.why4 = g(`d4.${key}.why4`, chain.why4)
    chain.why5 = g(`d4.${key}.why5`, chain.why5)
    chain.rootCause = g(`d4.${key}.rootCause`, chain.rootCause)
    chain.possibleCause = g(`d4.${key}.possibleCause`, chain.possibleCause)
    chain.causeDomain = g(`d4.${key}.causeDomain`, chain.causeDomain)
  }
  for (const key of ['sua', 'sun'] as const) {
    const sc = result.d4[key]
    sc.cause = g(`d4.${key}.cause`, sc.cause)
    sc.derivedFrom = g(`d4.${key}.derivedFrom`, sc.derivedFrom)
  }

  // D5
  result.d5.actions.forEach((a, i) => {
    a.action = g(`d5a${i}.action`, a.action)
    a.relatedRootCause = g(`d5a${i}.relatedRootCause`, a.relatedRootCause)
    a.verificationMethod = g(`d5a${i}.verificationMethod`, a.verificationMethod)
    a.notes = g(`d5a${i}.notes`, a.notes)
  })
  result.d5.plannedVerification = g('d5.plannedVerification', report.d5.plannedVerification)

  // D6
  result.d6.implementationStatus = g('d6.implementationStatus', report.d6.implementationStatus)
  result.d6.verificationResults = g('d6.verificationResults', report.d6.verificationResults)
  result.d6.containmentRemoved = g('d6.containmentRemoved', report.d6.containmentRemoved)

  // D7
  for (const key of ['fmea', 'controlPlan', 'workInstructions', 'testInspectionPlan', 'otherDocuments'] as const) {
    result.d7[key].actionRequired = g(`d7.${key}.actionRequired`, report.d7[key].actionRequired)
    result.d7[key].transfer = g(`d7.${key}.transfer`, report.d7[key].transfer)
  }

  // D8
  result.d8.lessonsLearned = g('d8.lessonsLearned', report.d8.lessonsLearned)
  result.d8.teamRecognition = g('d8.teamRecognition', report.d8.teamRecognition)

  return result
}

// ─── AI call ─────────────────────────────────────────────────────────────────

const MAX_TRANSLATION_BATCH_ENTRIES = 24
const MAX_TRANSLATION_BATCH_CHARS = 5_500

function buildTranslatedTextsSchema(keys: string[]) {
  return z.object(
    Object.fromEntries(keys.map((key) => [key, z.string()])) as Record<string, z.ZodString>,
  )
}

function chunkTexts(texts: Record<string, string>) {
  const entries = Object.entries(texts)
  const chunks: Array<Record<string, string>> = []
  let current: Record<string, string> = {}
  let currentChars = 0

  for (const [key, value] of entries) {
    const entrySize = key.length + value.length
    const shouldStartNewChunk =
      Object.keys(current).length >= MAX_TRANSLATION_BATCH_ENTRIES ||
      (Object.keys(current).length > 0 && currentChars + entrySize > MAX_TRANSLATION_BATCH_CHARS)

    if (shouldStartNewChunk) {
      chunks.push(current)
      current = {}
      currentChars = 0
    }

    current[key] = value
    currentChars += entrySize
  }

  if (Object.keys(current).length > 0) {
    chunks.push(current)
  }

  return chunks
}

function buildSystemPrompt(targetLanguage: 'en' | 'de') {
  const lang = targetLanguage === 'de' ? 'German' : 'English'
  return `You translate 8D report text snippets into ${lang}.
You receive a JSON object whose keys are field identifiers and values are the texts to translate.
Return a JSON object with the SAME keys and TRANSLATED values.
Rules:
1. Translate all values into ${lang}.
2. Keep keys exactly as given.
3. Preserve names, part numbers, codes, dates, and abbreviations.
4. Do not add or remove keys.
5. If a value is already in ${lang}, keep it unchanged.
6. Respond with ONLY valid JSON — no markdown fences.`
}

export async function translateReport(
  input: ReportTranslationInput,
): Promise<{ success: true; data: ReportTranslationResult } | { success: false; error: string }> {
  const texts = extractTexts(input.report)
  const keys = Object.keys(texts)

  // Nothing to translate — return the report with updated language
  if (keys.length === 0) {
    return {
      success: true,
      data: { ...input.report, language: input.targetLanguage },
    }
  }

  const translatedTexts: Record<string, string> = {}
  const chunks = chunkTexts(texts)

  for (const chunk of chunks) {
    const chunkKeys = Object.keys(chunk)
    const result = await callAIWithRetry({
      systemPrompt: buildSystemPrompt(input.targetLanguage),
      userPrompt: JSON.stringify(chunk),
      schema: buildTranslatedTextsSchema(chunkKeys),
      maxTokens: 3072,
      temperature: 0.1,
      maxRetries: 2,
      timeoutMs: 50_000,
    })

    if (!result.success) {
      return result
    }

    Object.assign(translatedTexts, result.data)
  }

  return {
    success: true,
    data: mergeTexts(input.report, translatedTexts, input.targetLanguage),
  }
}
