/**
 * FMEA Excel parser.
 *
 * Phase 1 contract:
 * - load .xlsx workbooks with ExcelJS
 * - flatten merged cells for header/data extraction
 * - detect the most likely header row, including two-row grouped headers
 * - map headers with exact, synonym, fuzzy, then deterministic fallback logic
 * - normalize rows to the canonical FmeaRow shape and validate with Zod
 */

import { Workbook } from 'exceljs'
import type { Cell, Worksheet } from 'exceljs'
import JSZip from 'jszip'
import type { ConfidenceLevel, FmeaRow, ParserResult } from '@/modules/fmea/types'
import { fmeaRowSchema } from '@/modules/fmea/schemas/formSchemas'
import {
  EXACT_HEADER_MATCHES,
  FUZZY_MATCH_THRESHOLD,
  REQUIRED_HEADER_FIELDS,
  SYNONYM_MAP,
} from './constants'
import { normalizeAPLevel } from './ap_lookup_table'
import { analyzeLegacyIndicators } from './documentValidation'

type HeaderMatch = {
  field: string
  confidence: ConfidenceLevel
  strategy: 'exact' | 'synonym' | 'fuzzy' | 'fallback'
}

type HeaderCandidate = {
  rowNumber: number
  anchorColumnNumber?: number
  headers: string[]
  mapping: Record<string, string>
  columnMapping: Record<number, string>
  confidence: ConfidenceLevel
  warnings: string[]
  score: number
}

type HeaderMappingResult = {
  mapping: Record<string, string>
  columnMapping: Record<number, string>
  confidence: ConfidenceLevel
  warnings: string[]
}

type HeaderSpan = {
  hasMergedCell: boolean
}

type CombinedHeaders = {
  headers: string[]
  combinedColumns: number
}

const MAX_HEADER_SCAN_ROWS = 12
const DRAWING_ANCHORS_ERROR = /Cannot read properties of undefined \(reading 'anchors'\)|reading 'anchors'/
const ROW_ANCHOR_HEADER_LABELS = new Set(['id', 'item', 'no', 'nr'])
const REQUIRED_HEADER_FIELD_SET = new Set<string>(REQUIRED_HEADER_FIELDS)
const TEXT_FIELDS = [
  'process_step',
  'function',
  'failure_mode',
  'failure_effect',
  'failure_cause',
  'prevention_control',
  'detection_control',
  'action_recommended',
  'responsible',
  'target_date',
  'classification',
  'special_characteristic',
] as const
const HEADER_LIKE_DATA_VALUES = new Set([
  'potentialfailuremode',
  'failuremode',
  'effectsoffailure',
  'effectoffailure',
  'potentialeffectsoffailure',
  'potentialeffectoffailure',
  'failureeffect',
  'causeoffailure',
  'causesoffailure',
  'potentialcauseoffailure',
  'potentialcausesoffailure',
  'failurecause',
  'severity',
  'occurrence',
  'detection',
  'actionpriority',
  'ap',
  'recommendedaction',
  'recommendedactions',
  'targetdate',
  'duedate',
  'responsible',
  'currentdesigncontrols',
  'prevention',
  'detectioncontrol',
  'preventioncontrol',
])

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\s/\\]+/g, '_')
    .replace(/[^\w]/g, '')
}

function compactHeader(header: string): string {
  return normalizeHeader(header).replace(/_/g, '')
}

function isRowAnchorHeader(header: string): boolean {
  const trimmed = header.trim().toLowerCase()
  if (trimmed === '#') return true
  const compact = compactHeader(header)
  return ROW_ANCHOR_HEADER_LABELS.has(compact)
}

function detectRowAnchorColumn(headers: string[]): number | undefined {
  for (let idx = 1; idx < headers.length; idx++) {
    if (headers[idx] && isRowAnchorHeader(headers[idx])) return idx
  }

  return undefined
}

function isRequiredHeaderField(field: string): boolean {
  return REQUIRED_HEADER_FIELD_SET.has(field)
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const candidate = value as {
      text?: string
      result?: unknown
      formula?: string
      richText?: Array<{ text?: string }>
      hyperlink?: string
    }
    if (candidate.text) return String(candidate.text).trim()
    if (candidate.result !== undefined) {
      if (typeof candidate.result === 'object' && candidate.result !== null && 'error' in candidate.result) {
        return '[FORMULA_ERROR]'
      }
      return valueToText(candidate.result)
    }
    
    if ('error' in candidate && candidate.error) return '[FORMULA_ERROR]'
    if (candidate.formula) return '[UNCACHED_FORMULA]'
    if (candidate.richText) {
      return candidate.richText.map((part) => part.text ?? '').join('').trim()
    }
    if (candidate.hyperlink) return String(candidate.hyperlink).trim()
  }
  return String(value).trim()
}

function valueToNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  const text = valueToText(value).replace(',', '.')
  const match = text.match(/\d+(\.\d+)?/)
  if (!match) return 0
  const parsed = Number.parseFloat(match[0])
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

function getEffectiveCellValue(cell: Cell): { value: unknown; flattened: boolean } {
  const merged = Boolean(cell.isMerged && cell.master && cell.master !== cell)
  return {
    value: merged ? cell.master.value : cell.value,
    flattened: merged,
  }
}

function readRowValues(worksheet: Worksheet, rowNumber: number): { values: string[]; flattened: number } {
  const row = worksheet.getRow(rowNumber)
  const values: string[] = []
  let flattened = 0

  for (let col = 1; col <= worksheet.columnCount; col++) {
    const { value, flattened: wasFlattened } = getEffectiveCellValue(row.getCell(col))
    values[col] = valueToText(value)
    if (wasFlattened && values[col]) flattened++
  }

  return { values, flattened }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function isInstructionalText(text: string): boolean {
  const normalized = text.toLowerCase().trim()
  if (!normalized) return false
  if (normalized.includes('?')) return true

  return (
    /\bhow\s+(could|can|does|do|is|are|should|would)\b/.test(normalized) ||
    /\bwhat\s+(could|can|does|do|is|are|should|would)\b/.test(normalized) ||
    /\b(steps?\s+required|required\s+to|used\s+to|use\s+to|enter|describe|identify|explain|example|e\.g\.|i\.e\.|instructions?|guidance)\b/.test(normalized) ||
    /\bdocument\s+(the|a|an|all|required|recommended)\b/.test(normalized)
  )
}

function isProseHeaderText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return isInstructionalText(trimmed) || trimmed.length > 70 || countWords(trimmed) > 8
}

function isShortCategoricalHeader(text: string): boolean {
  const trimmed = text.trim()
  return Boolean(trimmed) && trimmed.length <= 50 && countWords(trimmed) <= 5 && !isInstructionalText(trimmed)
}

function isShortChildHeader(text: string): boolean {
  const trimmed = text.trim()
  return Boolean(trimmed) && trimmed.length <= 40 && countWords(trimmed) <= 4 && !isInstructionalText(trimmed)
}

function getMergedParentSpans(
  worksheet: Worksheet,
  rowNumber: number,
  values: string[]
): Map<number, HeaderSpan> {
  const spansByColumn = new Map<number, HeaderSpan>()
  const row = worksheet.getRow(rowNumber)
  let idx = 1

  while (idx < values.length) {
    const parent = values[idx]?.trim() ?? ''
    if (!parent) {
      idx++
      continue
    }

    const normalizedParent = compactHeader(parent)
    let end = idx
    while (
      end + 1 < values.length &&
      compactHeader(values[end + 1] ?? '') === normalizedParent
    ) {
      end++
    }

    const hasMergedCell = Array.from({ length: end - idx + 1 }, (_, offset) => idx + offset)
      .some((columnNumber) => Boolean(row.getCell(columnNumber).isMerged))

    if (end > idx && hasMergedCell) {
      const span = { hasMergedCell }
      for (let columnNumber = idx; columnNumber <= end; columnNumber++) {
        spansByColumn.set(columnNumber, span)
      }
    }

    idx = end + 1
  }

  return spansByColumn
}

function combineHeaders(
  parentRow: string[],
  childRow: string[],
  worksheet: Worksheet,
  parentRowNumber: number
): CombinedHeaders {
  const maxLength = Math.max(parentRow.length, childRow.length)
  const combined: string[] = []
  const parentSpans = getMergedParentSpans(worksheet, parentRowNumber, parentRow)
  let combinedColumns = 0

  for (let idx = 1; idx < maxLength; idx++) {
    const parent = parentRow[idx]?.trim() ?? ''
    const child = childRow[idx]?.trim() ?? ''
    const parentSpan = parentSpans.get(idx)
    const canCombine = Boolean(
      parentSpan &&
      parentSpan.hasMergedCell &&
      parent &&
      child &&
      compactHeader(parent) !== compactHeader(child) &&
      isShortCategoricalHeader(parent) &&
      isShortChildHeader(child)
    )

    if (canCombine) {
      combined[idx] = `${parent} ${child}`
      combinedColumns++
    } else {
      combined[idx] = child || (parentSpan && !isRowAnchorHeader(parent) ? '' : parent)
    }
  }

  return { headers: combined, combinedColumns }
}

function tryExactMatch(header: string): HeaderMatch | null {
  if (isRowAnchorHeader(header)) return null

  const normalized = normalizeHeader(header)
  const exact = Object.entries(EXACT_HEADER_MATCHES).find(
    ([key]) => normalizeHeader(key) === normalized
  )

  return exact ? { field: exact[1], confidence: 'High', strategy: 'exact' } : null
}

function findSynonymMatches(header: string): HeaderMatch[] {
  if (isRowAnchorHeader(header)) return []

  const normalized = normalizeHeader(header)
  const matches: HeaderMatch[] = []

  for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (synonyms.some((synonym) => normalizeHeader(synonym) === normalized)) {
      matches.push({ field, confidence: 'High', strategy: 'synonym' })
    }
  }

  return matches
}

function trySynonymMatch(header: string): HeaderMatch | null {
  return findSynonymMatches(header)[0] ?? null
}

function tokenizeHeader(header: string): Set<string> {
  return new Set(
    header
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  )
}

function hasToken(tokens: Set<string>, values: string[]): boolean {
  return values.some((value) => tokens.has(value))
}

function tryContextualMatch(header: string): HeaderMatch | null {
  if (isProseHeaderText(header) || isRowAnchorHeader(header)) return null

  const compact = compactHeader(header)
  const tokens = tokenizeHeader(header)
  const hasFailure = hasToken(tokens, ['failure', 'failures', 'fehler'])
  const hasControl = hasToken(tokens, ['control', 'controls', 'design', 'current'])

  if (
    compact.includes('currentdesigncontrolsprevention') ||
    (hasControl && hasToken(tokens, ['prevention', 'preventive']))
  ) {
    return { field: 'prevention_control', confidence: 'High', strategy: 'synonym' }
  }

  if (
    compact.includes('currentdesigncontrolsdetection') ||
    (hasControl && hasToken(tokens, ['detection', 'detective']))
  ) {
    return { field: 'detection_control', confidence: 'High', strategy: 'synonym' }
  }

  if (hasFailure && hasToken(tokens, ['effect', 'effects', 'auswirkung', 'effets'])) {
    return { field: 'failure_effect', confidence: 'High', strategy: 'synonym' }
  }

  if (hasFailure && hasToken(tokens, ['cause', 'causes', 'ursache'])) {
    return { field: 'failure_cause', confidence: 'High', strategy: 'synonym' }
  }

  if (hasFailure && hasToken(tokens, ['mode', 'modes', 'art'])) {
    return { field: 'failure_mode', confidence: 'High', strategy: 'synonym' }
  }

  if (hasToken(tokens, ['action']) && hasToken(tokens, ['priority', 'ap'])) {
    return { field: 'ap_current', confidence: 'High', strategy: 'synonym' }
  }

  if (hasToken(tokens, ['recommended', 'recommendation']) && hasToken(tokens, ['action', 'actions'])) {
    return { field: 'action_recommended', confidence: 'High', strategy: 'synonym' }
  }

  if (hasToken(tokens, ['target', 'due', 'completion']) && hasToken(tokens, ['date'])) {
    return { field: 'target_date', confidence: 'High', strategy: 'synonym' }
  }

  return null
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length] ?? 0
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = compactHeader(str1)
  const s2 = compactHeader(str2)
  if (s1 === s2) return 1

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  if (longer.length === 0) return 1

  return (longer.length - getEditDistance(longer, shorter)) / longer.length
}

function tryFuzzyMatch(header: string): HeaderMatch | null {
  if (isProseHeaderText(header) || isRowAnchorHeader(header)) return null

  let bestMatch: { field: string; similarity: number } | null = null

  for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const synonym of synonyms) {
      const similarity = calculateStringSimilarity(header, synonym)
      if (similarity >= FUZZY_MATCH_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { field, similarity }
      }
    }
  }

  if (!bestMatch) return null

  return {
    field: bestMatch.field,
    confidence: bestMatch.similarity >= 0.8 ? 'Medium' : 'Low',
    strategy: 'fuzzy',
  }
}

function tryDeterministicFallback(header: string): HeaderMatch | null {
  if (isProseHeaderText(header) || isRowAnchorHeader(header)) return null

  const compact = compactHeader(header)

  const orderedPatterns: Array<[string, string[]]> = [
    ['ap_current', ['actionpriority', 'currentap', 'ap']],
    ['action_recommended', ['recommendedaction', 'recommendedactions', 'actionrecommended', 'actionsrecommended']],
    ['failure_mode', ['failuremode', 'fehlerart', 'mode']],
    ['failure_effect', ['failureeffect', 'effect', 'auswirkung']],
    ['failure_cause', ['failurecause', 'cause', 'ursache']],
    ['severity', ['severity', 'sev', 'bedeutung']],
    ['occurrence', ['occurrence', 'occur', 'occ',  'auftreten' ]],
    ['detection_control', ['detectioncontrol', 'detectivecontrol', 'controlsdetection', 'currentdesigncontrolsdetection']],
    ['detection', ['detection', 'detectability', 'det', 'entdeckung']],
    ['prevention_control', ['preventioncontrol', 'preventivecontrol', 'controlsprevention', 'currentdesigncontrolsprevention']],
    ['action_recommended', ['action']],
    ['responsible', ['responsible', 'owner']],
    ['target_date', ['targetdate', 'duedate']],
    ['process_step', ['processstep', 'process']],
    ['function', ['function']],
    ['classification', ['classification']],
    ['special_characteristic', ['specialcharacteristic', 'specialchar']],
  ]

  for (const [field, patterns] of orderedPatterns) {
    if (patterns.some((pattern) => compact === pattern || (pattern.length >= 8 && compact.includes(pattern)))) {
      return { field, confidence: 'Low', strategy: 'fallback' }
    }
  }

  return null
}

function getAmbiguousRequiredFields(header: string): string[] {
  if (isProseHeaderText(header) || isRowAnchorHeader(header)) return []
  if (tryExactMatch(header)) return []

  const synonymMatches = findSynonymMatches(header)
  const contextualMatch = tryContextualMatch(header)
  const fields = [
    ...synonymMatches.map((match) => match.field),
    ...(contextualMatch ? [contextualMatch.field] : []),
  ]
  const requiredFields = Array.from(new Set(fields)).filter(isRequiredHeaderField)

  return requiredFields.length > 1 ? requiredFields : []
}

async function mapHeaders(
  headers: string[],
  anchorColumnNumber?: number
): Promise<HeaderMappingResult> {
  const mapping: Record<string, string> = {}
  const columnMapping: Record<number, string> = {}
  const usedFields = new Map<string, string>()
  const warnings: string[] = []
  const confidenceScores: ConfidenceLevel[] = []

  for (let idx = 1; idx < headers.length; idx++) {
    const header = headers[idx]?.trim()
    if (!header) continue
    if (idx === anchorColumnNumber || isRowAnchorHeader(header)) continue

    const ambiguousRequiredFields = getAmbiguousRequiredFields(header)
    if (ambiguousRequiredFields.length > 0) {
      warnings.push(
        `Required header mapping for "${header}" is ambiguous: ${ambiguousRequiredFields.join(', ')}`
      )
      continue
    }

    const result =
      tryExactMatch(header) ??
      trySynonymMatch(header) ??
      tryContextualMatch(header) ??
      tryFuzzyMatch(header) ??
      tryDeterministicFallback(header)

    if (!result) {
      continue
    }

    const existingHeader = usedFields.get(result.field)
    if (existingHeader) {
      if (isRequiredHeaderField(result.field)) {
        warnings.push(
          `Duplicate mapping for required header "${result.field}": "${header}" was ignored because "${existingHeader}" already maps to that field`
        )
      }
      continue
    }

    mapping[header] = result.field
    columnMapping[idx] = result.field
    usedFields.set(result.field, header)
    confidenceScores.push(result.confidence)
  }

  let confidence: ConfidenceLevel = 'High'
  if (confidenceScores.includes('Low')) confidence = 'Low'
  else if (confidenceScores.includes('Medium')) confidence = 'Medium'

  return { mapping, columnMapping, confidence, warnings }
}

async function scoreHeaderCandidate(rowNumber: number, headers: string[]): Promise<HeaderCandidate> {
  const anchorColumnNumber = detectRowAnchorColumn(headers)
  const { mapping, columnMapping, confidence, warnings } = await mapHeaders(headers, anchorColumnNumber)
  const mappedFields = new Set(Object.values(mapping))
  const mandatoryCount = REQUIRED_HEADER_FIELDS.filter((field) => mappedFields.has(field)).length
  const mappedCount = mappedFields.size
  const nonEmptyCount = headers.filter(Boolean).length
  const proseHeaderCount = headers.filter((header) => Boolean(header) && isProseHeaderText(header)).length

  return {
    rowNumber,
    anchorColumnNumber,
    headers,
    mapping,
    columnMapping,
    confidence,
    warnings,
    score: mandatoryCount * 20 + mappedCount * 4 + Math.min(nonEmptyCount, 20) - proseHeaderCount * 8,
  }
}

async function detectHeaderRow(
  worksheet: Worksheet,
  explicitHeaderRow?: number
): Promise<{ candidate: HeaderCandidate; flattenedCount: number }> {
  if (explicitHeaderRow) {
    const current = readRowValues(worksheet, explicitHeaderRow)
    const parent = explicitHeaderRow > 1 ? readRowValues(worksheet, explicitHeaderRow - 1) : null
    const combined = parent
      ? combineHeaders(parent.values, current.values, worksheet, explicitHeaderRow - 1)
      : null
    const headers = combined && combined.combinedColumns > 0 ? combined.headers : current.values
    const candidate = await scoreHeaderCandidate(explicitHeaderRow, headers)
    return { candidate, flattenedCount: current.flattened + (parent?.flattened ?? 0) }
  }

  const lastRow = Math.min(worksheet.rowCount, MAX_HEADER_SCAN_ROWS)
  let best: HeaderCandidate | null = null
  let flattenedCount = 0

  for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
    const current = readRowValues(worksheet, rowNumber)
    flattenedCount += current.flattened

    const singleRowCandidate = await scoreHeaderCandidate(rowNumber, current.values)
    if (!best || singleRowCandidate.score > best.score) best = singleRowCandidate

    if (rowNumber > 1) {
      const parent = readRowValues(worksheet, rowNumber - 1)
      const combined = combineHeaders(parent.values, current.values, worksheet, rowNumber - 1)
      if (combined.combinedColumns > 0) {
        const combinedCandidate = await scoreHeaderCandidate(rowNumber, combined.headers)
        if (combinedCandidate.score > best.score) best = combinedCandidate
      }
    }
  }

  if (!best || Object.keys(best.mapping).length === 0) {
    throw new Error('Could not detect a usable FMEA header row')
  }

  return { candidate: best, flattenedCount }
}

function isStrictRatingValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 10
  }

  const text = valueToText(value)
  return /^(10|[1-9])$/.test(text)
}

function isStrictPositiveIntegerAnchorValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0
  }

  const text = valueToText(value)
  if (!/^[1-9]\d*$/.test(text)) return false

  const parsed = Number.parseInt(text, 10)
  return Number.isSafeInteger(parsed) && parsed > 0
}

function isMeaningfulDataText(value: unknown): boolean {
  const text = valueToText(value)
  if (!text) return false
  if (HEADER_LIKE_DATA_VALUES.has(compactHeader(text))) return false
  if (/^[-–—.\s]+$/.test(text)) return false
  return !isInstructionalText(text)
}

function isQualifiedDataRow(rawRow: Record<string, unknown>): boolean {
  const ratingSignal =
    isStrictRatingValue(rawRow.severity) ||
    isStrictRatingValue(rawRow.occurrence) ||
    isStrictRatingValue(rawRow.detection)
  const apSignal = normalizeAPLevel(valueToText(rawRow.ap_current)) !== null

  const contentTextSignal = [
    rawRow.failure_mode,
    rawRow.failure_cause,
    rawRow.action_recommended,
  ].some(isMeaningfulDataText)

  return ratingSignal || apSignal || contentTextSignal
}

function normalizeRow(rawRow: Record<string, unknown>, sourceRowNumber: number, sheetName: string): FmeaRow | null {
  if (Object.values(rawRow).every((value) => valueToText(value) === '')) return null

  const row: Partial<FmeaRow> = {
    id: `${sheetName}_${sourceRowNumber}`,
    source_reference: { sheet: sheetName, row: sourceRowNumber },
  }

  for (const field of TEXT_FIELDS) {
    row[field] = valueToText(rawRow[field])
  }

  row.severity = valueToNumber(rawRow.severity)
  row.occurrence = valueToNumber(rawRow.occurrence)
  row.detection = valueToNumber(rawRow.detection)

  const normalizedAP = normalizeAPLevel(valueToText(rawRow.ap_current))
  if (normalizedAP) row.ap_current = normalizedAP

  return row as FmeaRow
}

function validateNormalizedRow(row: FmeaRow): string[] {
  const parsed = fmeaRowSchema.safeParse(row)
  if (parsed.success) return []

  return parsed.error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : 'row'
    return `Row ${row.source_reference.row}: ${path} - ${issue.message}`
  })
}

function isExcelDrawingAnchorsError(error: unknown): boolean {
  return error instanceof Error
    ? DRAWING_ANCHORS_ERROR.test(error.message) || DRAWING_ANCHORS_ERROR.test(error.stack ?? '')
    : DRAWING_ANCHORS_ERROR.test(String(error))
}

async function stripDrawingParts(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(buffer)
  const entries = Object.keys(zip.files)

  for (const entryName of entries) {
    if (
      entryName.startsWith('xl/drawings/') ||
      entryName.startsWith('xl/media/') ||
      entryName.match(/^xl\/comments\d+[.]xml$/) ||
      entryName.match(/^xl\/threadedComments\/threadedComment\d+[.]xml$/)
    ) {
      zip.remove(entryName)
    }
  }

  for (const entryName of entries.filter((name) => name.match(/^xl\/worksheets\/sheet\d+[.]xml$/))) {
    const entry = zip.file(entryName)
    if (!entry) continue

    const xml = await entry.async('string')
    zip.file(
      entryName,
      xml
        .replace(/<drawing\b[^>]*\/>/g, '')
        .replace(/<legacyDrawing\b[^>]*\/>/g, '')
        .replace(/<legacyDrawingHF\b[^>]*\/>/g, '')
    )
  }

  for (const entryName of entries.filter((name) => name.match(/^xl\/worksheets\/_rels\/sheet\d+[.]xml[.]rels$/))) {
    const entry = zip.file(entryName)
    if (!entry) continue

    const xml = await entry.async('string')
    zip.file(
      entryName,
      xml.replace(
        /<Relationship\b(?=[^>]*Type="[^"]*\/(?:drawing|comments|vmlDrawing|image)")[^>]*\/>/g,
        ''
      )
    )
  }

  return zip.generateAsync({ type: 'arraybuffer' })
}

async function loadWorkbookForParsing(buffer: ArrayBuffer): Promise<Workbook> {
  const workbook = new Workbook()

  try {
    await workbook.xlsx.load(buffer)
    return workbook
  } catch (error) {
    if (!isExcelDrawingAnchorsError(error)) throw error

    const sanitizedBuffer = await stripDrawingParts(buffer)
    const sanitizedWorkbook = new Workbook()
    await sanitizedWorkbook.xlsx.load(sanitizedBuffer)
    return sanitizedWorkbook
  }
}

export async function parseExcelFMEA(
  buffer: ArrayBuffer,
  options?: { sheet_index?: number; header_row?: number }
): Promise<ParserResult> {
  const sheetIndex = options?.sheet_index ?? 0

  try {
    const workbook = await loadWorkbookForParsing(buffer)

    const worksheet = workbook.worksheets[sheetIndex]
    if (!worksheet) throw new Error(`Sheet index ${sheetIndex} not found`)

    const sheetName = worksheet.name || `Sheet_${sheetIndex + 1}`
    const { candidate, flattenedCount } = await detectHeaderRow(worksheet, options?.header_row)
    const warnings = [...candidate.warnings]
    const rows: FmeaRow[] = []
    let emptyRows = 0
    let invalidRows = 0
    let dataFlattened = 0
    let scannedRows = 0
    let qualifiedRows = 0
    let skippedRows = 0

    // Capture raw headers for document-level validation.
    const raw_headers = candidate.headers
      .slice(1)
      .filter((header) => Boolean(header) && !isRowAnchorHeader(header))

    // Identify unmapped headers (headers that don't map to canonical FmeaRow fields)
    const unmapped_headers: string[] = []
    for (let idx = 1; idx < candidate.headers.length; idx++) {
      const header = candidate.headers[idx]
      if (header && idx !== candidate.anchorColumnNumber && !isRowAnchorHeader(header) && !candidate.mapping[header]) {
        unmapped_headers.push(header)
      }
    }

    const headerByColumn = new Map<number, string>()
    for (const [columnNumber, field] of Object.entries(candidate.columnMapping)) {
      headerByColumn.set(Number(columnNumber), field)
    }

    for (let rowNumber = candidate.rowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const rowData = worksheet.getRow(rowNumber)
      const rowObj: Record<string, unknown> = {}
      let hasData = false
      scannedRows++

      if (candidate.anchorColumnNumber) {
        const { value, flattened } = getEffectiveCellValue(rowData.getCell(candidate.anchorColumnNumber))
        if (flattened) dataFlattened++

        if (!isStrictPositiveIntegerAnchorValue(value)) {
          emptyRows++
          skippedRows++
          continue
        }
      }

      for (const [columnNumber, field] of headerByColumn.entries()) {
        const { value, flattened } = getEffectiveCellValue(rowData.getCell(columnNumber))
        if (flattened) dataFlattened++
        
        const textValue = valueToText(value)
        
        if (textValue === '[UNCACHED_FORMULA]') {
          const colName = candidate.headers[columnNumber] || `Column ${columnNumber}`
          const warningMsg = `Found uncalculated formula(s) in column "${colName}". Please save the workbook in Excel to generate cached results, or copy and paste as values.`
          if (!warnings.includes(warningMsg)) {
            warnings.push(warningMsg)
          }
          rowObj[field] = ''
          hasData = true
        } else if (textValue === '[FORMULA_ERROR]') {
          const colName = candidate.headers[columnNumber] || `Column ${columnNumber}`
          const warningMsg = `Found formula error(s) in column "${colName}".`
          if (!warnings.includes(warningMsg)) {
            warnings.push(warningMsg)
          }
          rowObj[field] = ''
          hasData = true
        } else {
          if (textValue !== '') hasData = true
          rowObj[field] = value
        }
      }

      if (!hasData) {
        emptyRows++
        continue
      }

      if (!isQualifiedDataRow(rowObj)) {
        emptyRows++
        skippedRows++
        continue
      }

      const normalized = normalizeRow(rowObj, rowNumber, sheetName)
      if (!normalized) {
        emptyRows++
        continue
      }

      const rowErrors = validateNormalizedRow(normalized)
      if (rowErrors.length > 0) {
        invalidRows++
      }

      rows.push(normalized)
      qualifiedRows++
    }

    const mappedFields = Object.values(candidate.mapping)
    for (const requiredField of REQUIRED_HEADER_FIELDS) {
      if (!mappedFields.includes(requiredField)) {
        warnings.push(`Required header "${requiredField}" was not found in detected headers`)
      }
    }

    const legacyIndicatorHeaders = [...raw_headers]
    if (candidate.anchorColumnNumber && candidate.rowNumber + 1 <= worksheet.rowCount) {
      const nextRowValues = readRowValues(worksheet, candidate.rowNumber + 1).values
      if (!isStrictPositiveIntegerAnchorValue(nextRowValues[candidate.anchorColumnNumber])) {
        legacyIndicatorHeaders.push(...nextRowValues.filter(Boolean))
      }
    }

    // Analyze legacy indicators at document level
    const legacy_indicators = analyzeLegacyIndicators(legacyIndicatorHeaders, candidate.mapping)

    return {
      rows,
      header_map: candidate.mapping,
      raw_headers,
      unmapped_headers,
      confidence: candidate.confidence,
      warnings,
      legacy_indicators,
      metadata: {
        total_rows: rows.length,
        empty_rows: emptyRows,
        scanned_rows: scannedRows,
        qualified_rows: qualifiedRows,
        skipped_rows: skippedRows,
        merged_cells_flattened: flattenedCount + dataFlattened,
        header_row: candidate.rowNumber,
        sheet_name: sheetName,
        invalid_rows: invalidRows,
      },
    }
  } catch (err) {
    throw new Error(`Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export function validateParserResult(result: ParserResult): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (result.rows.length === 0) {
    errors.push('No data rows found in FMEA file')
  }

  return { valid: errors.length === 0, errors }
}
