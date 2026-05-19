/**
 * Document-level FMEA validation.
 *
 * This module consumes parser metadata and emits workbook-level findings.
 * It does not infer workbook structure independently from row values.
 */

import type {
  FmeaDocumentValidationContext,
  FmeaIssue,
  LegacyFmeaIndicators,
} from '@/modules/fmea/types'

const RPN_TOKEN_PATTERN = /(^|[^a-z0-9])r[.\s-]*p[.\s-]*n($|[^a-z0-9])/i
const RISK_PRIORITY_NUMBER_PATTERN = /\brisk\s+priority\s+number\b/i
const SOD_ABBREVIATED_FORMULA_PATTERN = /(^|[^a-z0-9])s\s*(?:x|\*|×)\s*o\s*(?:x|\*|×)\s*d($|[^a-z0-9])/i
const SOD_WORD_FORMULA_PATTERN = /\bseverity\s*(?:x|\*|×)\s*occurrence\s*(?:x|\*|×)\s*detection\b/i

const LEGACY_TERMINOLOGY_PATTERNS = [
  /4th\s+edition/i,
  /pre[_\-\s]?5th/i,
  /old\s+rpn|legacy\s+rpn/i,
  /deprecated\s+prioriti[sz]ation/i,
  /outdated\s+prioriti[sz]ation/i,
  /deprecated\s+risk\s+ranking/i,
]

type DocumentValidationInput = LegacyFmeaIndicators | FmeaDocumentValidationContext

function normalizeHeaderText(header: string): string {
  return header.toLowerCase().replace(/\s+/g, ' ').trim()
}

function isDocumentValidationContext(input: DocumentValidationInput): input is FmeaDocumentValidationContext {
  return 'legacy_indicators' in input && 'header_map' in input
}

function getLegacyIndicators(input: DocumentValidationInput): LegacyFmeaIndicators {
  return isDocumentValidationContext(input) ? input.legacy_indicators : input
}

function getMappedApColumnNames(mappedHeaders: Record<string, string>): string[] {
  return Object.entries(mappedHeaders)
    .filter(([, field]) => field === 'ap_current')
    .map(([header]) => header)
}

function hasExplicitRpnEvidence(header: string): boolean {
  const normalized = normalizeHeaderText(header).replace(/\u00d7/g, 'x')
  const compact = normalized.replace(/[^a-z0-9]/g, '')
  const compactRpnHeader =
    compact === 'rpn' ||
    compact.startsWith('rpn') ||
    compact.endsWith('rpn') ||
    compact.includes('riskprioritynumber')

  return (
    compactRpnHeader ||
    RPN_TOKEN_PATTERN.test(normalized) ||
    RISK_PRIORITY_NUMBER_PATTERN.test(normalized) ||
    SOD_ABBREVIATED_FORMULA_PATTERN.test(normalized) ||
    SOD_WORD_FORMULA_PATTERN.test(normalized)
  )
}

/**
 * Scan detected workbook headers for explicit RPN methodology indicators.
 *
 * This intentionally does not match natural language that merely mentions
 * severity, occurrence, and detection.
 */
export function detectRPNHeaders(headers: string[]): {
  has_rpn_header: boolean
  rpn_column_names: string[]
  rpn_detection_evidence: string[]
} {
  const rpnHeaders: string[] = []

  for (const header of headers) {
    if (!header || header.trim() === '') continue
    if (hasExplicitRpnEvidence(header)) rpnHeaders.push(header)
  }

  return {
    has_rpn_header: rpnHeaders.length > 0,
    rpn_column_names: rpnHeaders,
    rpn_detection_evidence: rpnHeaders,
  }
}

/**
 * Scan headers for explicit legacy edition terminology.
 */
export function detect4thEditionTerminology(headers: string[]): {
  has_4th_edition_terminology: boolean
  legacy_terminology_found: string[]
} {
  const foundTerms: string[] = []

  for (const header of headers) {
    if (!header || header.trim() === '') continue

    for (const pattern of LEGACY_TERMINOLOGY_PATTERNS) {
      if (pattern.test(header)) {
        foundTerms.push(header)
        break
      }
    }
  }

  return {
    has_4th_edition_terminology: foundTerms.length > 0,
    legacy_terminology_found: foundTerms,
  }
}

/**
 * Check AP presence from finalized canonical header mapping.
 */
export function checkAPColumnPresence(mappedHeaders: Record<string, string>): {
  has_ap_column: boolean
  missing_ap_column: boolean
  ap_column_names: string[]
} {
  const apColumnNames = getMappedApColumnNames(mappedHeaders)

  return {
    has_ap_column: apColumnNames.length > 0,
    missing_ap_column: apColumnNames.length === 0,
    ap_column_names: apColumnNames,
  }
}

/**
 * Compile workbook-level indicators from parser metadata.
 */
export function analyzeLegacyIndicators(
  raw_headers: string[],
  mapped_headers: Record<string, string>
): LegacyFmeaIndicators {
  const rpnHeaders = detectRPNHeaders(raw_headers)
  const legacy4th = detect4thEditionTerminology(raw_headers)
  const apPresence = checkAPColumnPresence(mapped_headers)

  return {
    has_rpn_header: rpnHeaders.has_rpn_header,
    rpn_column_names: rpnHeaders.rpn_column_names,
    rpn_detection_evidence: rpnHeaders.rpn_detection_evidence,
    has_4th_edition_terminology: legacy4th.has_4th_edition_terminology,
    legacy_terminology_found: legacy4th.legacy_terminology_found,
    has_ap_column: apPresence.has_ap_column,
    missing_ap_column: apPresence.missing_ap_column,
    ap_column_names: apPresence.ap_column_names,
    mapped_fields: Object.values(mapped_headers),
  }
}

/**
 * R-07: Legacy RPN detection.
 *
 * Triggers only on strong deterministic evidence:
 * - explicit RPN/Risk Priority Number/SxOxD header or formula, or
 * - explicit 4th Edition/deprecated prioritization terminology.
 */
export function validateLegacyRPN(input: DocumentValidationInput): FmeaIssue | null {
  const indicators = getLegacyIndicators(input)
  const apColumnNames = isDocumentValidationContext(input)
    ? getMappedApColumnNames(input.header_map)
    : indicators.ap_column_names
  const hasAPColumn = apColumnNames.length > 0 || indicators.has_ap_column
  const missingAPColumn = !hasAPColumn
  const hasRPNColumn = indicators.has_rpn_header
  const hasLegacyTerminology = indicators.has_4th_edition_terminology

  const isLegacy = hasRPNColumn || hasLegacyTerminology
  if (!isLegacy) return null

  const evidence: string[] = []
  if (hasRPNColumn) {
    evidence.push(`RPN evidence found: ${indicators.rpn_detection_evidence.join(', ')}`)
  }
  if (missingAPColumn) {
    evidence.push('AP (Action Priority) column missing')
  }
  if (hasLegacyTerminology) {
    evidence.push(`legacy terminology found: ${indicators.legacy_terminology_found.join(', ')}`)
  }

  return {
    ruleId: 'R-07',
    severity: 'High',
    message: `Legacy RPN reference detected. Document appears to use RPN/SxOxD prioritization instead of AIAG/VDA Action Priority. Evidence: ${evidence.join('; ')}.`,
    field: 'ap_current',
    confidence: hasRPNColumn ? 'High' : 'Medium',
  }
}

export function validateDocumentStructure(
  input: DocumentValidationInput
): Array<FmeaIssue & { scope: 'document' }> {
  const issues: Array<FmeaIssue & { scope: 'document' }> = []

  const r07Issue = validateLegacyRPN(input)
  if (r07Issue) {
    issues.push({
      ...r07Issue,
      scope: 'document',
    })
  }

  return issues
}
