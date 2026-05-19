/**
 * FMEA Rules Engine
 * 
 * Implements 8 deterministic validation rules (R-01 to R-08)
 * Rules run sequentially and accumulate findings
 * 
 * Architecture:
 * - Document-level rules (R-07): Run on workbook structure BEFORE normalization
 * - Row-level rules (R-01 to R-06, R-08): Run on normalized rows
 */

import type {
  APLevel,
  FmeaDocumentValidationContext,
  FmeaRow,
  FmeaIssue,
  FmeaIssueSummary,
  FmeaValidationResult,
  IssueSeverity,
  LegacyFmeaIndicators,
} from '@/modules/fmea/types'
import { MANDATORY_FIELDS } from './constants'
import { getAPFromLookup } from './ap_lookup_table'
import { validateDocumentStructure } from './documentValidation'

type DocumentValidationInput = LegacyFmeaIndicators | FmeaDocumentValidationContext

/* ────────────────────────────────────────────────────────────────── */
/*  Rule Definitions                                                  */
/* ────────────────────────────────────────────────────────────────── */

/**
 * R-01: Mandatory Fields Present
 * Checks if all mandatory fields are present and non-empty
 */
function isValidRating(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10
}

function isValidAPLevel(value: unknown): value is APLevel {
  return value === 'H' || value === 'M' || value === 'L'
}

function isMandatoryFieldFilled(row: FmeaRow, field: typeof MANDATORY_FIELDS[number]): boolean {
  const value = row[field as keyof FmeaRow]

  if (field === 'severity' || field === 'occurrence' || field === 'detection') {
    return isValidRating(value)
  }

  return value !== null && value !== undefined && value !== ''
}

function getMissingMandatoryFields(row: FmeaRow): string[] {
  return MANDATORY_FIELDS.filter((field) => !isMandatoryFieldFilled(row, field))
}

function hasCompleteApEvaluationInputs(row: FmeaRow): boolean {
  return (
    isValidRating(row.severity) &&
    isValidRating(row.occurrence) &&
    isValidRating(row.detection) &&
    isValidAPLevel(row.ap_current)
  )
}

type ApEvaluationStatus = 'compliant' | 'non_compliant' | 'not_evaluatable'

function getApEvaluationStatus(row: FmeaRow): ApEvaluationStatus {
  if (!hasCompleteApEvaluationInputs(row)) return 'not_evaluatable'

  try {
    return row.ap_current === getAPFromLookup(row.severity, row.occurrence, row.detection)
      ? 'compliant'
      : 'non_compliant'
  } catch {
    return 'non_compliant'
  }
}

function checkMandatoryFields(row: FmeaRow): FmeaIssue | null {
  const missing = getMissingMandatoryFields(row)

  if (missing.length > 0) {
    return {
      ruleId: 'R-01',
      severity: 'High',
      message: `Mandatory fields missing: ${missing.join(', ')}`,
      field: missing[0],
      confidence: 'High'
    }
  }

  return null
}

function singularPlural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    ap_current: 'Action Priority',
    severity: 'Severity',
    occurrence: 'Occurrence',
    detection: 'Detection',
    failure_mode: 'failure mode',
    failure_cause: 'failure cause',
    target_date: 'target completion date',
    responsible: 'responsible owner',
    action_recommended: 'recommended action',
  }

  return labels[field] ?? field.replace(/_/g, ' ')
}

function missingFieldsFromIssue(issue: FmeaIssue): string[] {
  if (issue.ruleId !== 'R-01') return [issue.field]
  const prefix = 'Mandatory fields missing:'
  if (!issue.message.startsWith(prefix)) return [issue.field]

  return issue.message
    .slice(prefix.length)
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean)
}

function getSummaryText(ruleId: string, field: string, count: number, fallbackMessage: string): string {
  const rowWord = singularPlural(count, 'row', 'rows')

  if (ruleId === 'R-01') {
    return `${count} ${rowWord} ${singularPlural(count, 'is', 'are')} missing ${getFieldLabel(field)} values.`
  }

  if (ruleId === 'R-02') {
    return `${count} ${rowWord} ${singularPlural(count, 'has', 'have')} Action Priority values that do not match the AIAG/VDA S/O/D lookup.`
  }

  if (ruleId === 'R-03') {
    return `${count} ${rowWord} ${singularPlural(count, 'has', 'have')} High Action Priority without recommended actions.`
  }

  if (ruleId === 'R-04') {
    return `${count} ${rowWord} ${singularPlural(count, 'has', 'have')} Medium Action Priority without recommended actions.`
  }

  if (ruleId === 'R-05') {
    return `${count} ${rowWord} ${singularPlural(count, 'contains', 'contain')} recommended actions without responsible owners.`
  }

  if (ruleId === 'R-06') {
    return `${count} ${rowWord} ${singularPlural(count, 'contains', 'contain')} recommended actions without target completion dates.`
  }

  return `${count} ${rowWord} triggered ${ruleId}: ${fallbackMessage}`
}

function buildIssueSummaries(
  issues: Array<FmeaIssue & { row_id: string }>,
  rows: FmeaRow[]
): FmeaIssueSummary[] {
  const rowById = new Map(rows.map((row) => [row.id, row]))
  const grouped = new Map<
    string,
    {
      ruleId: string
      severity: IssueSeverity
      field: string
      fallbackMessage: string
      rowIds: Set<string>
      sourceRows: Set<number>
    }
  >()

  for (const issue of issues) {
    if (issue.row_id === 'document') continue

    for (const field of missingFieldsFromIssue(issue)) {
      const key = `${issue.ruleId}:${field}`
      const group = grouped.get(key) ?? {
        ruleId: issue.ruleId,
        severity: issue.severity,
        field,
        fallbackMessage: issue.message,
        rowIds: new Set<string>(),
        sourceRows: new Set<number>(),
      }
      const row = rowById.get(issue.row_id)
      group.rowIds.add(issue.row_id)
      if (row) group.sourceRows.add(row.source_reference.row)
      grouped.set(key, group)
    }
  }

  return Array.from(grouped.values())
    .map((group) => {
      const rowIds = Array.from(group.rowIds)
      const sourceRows = Array.from(group.sourceRows).sort((a, b) => a - b)
      return {
        ruleId: group.ruleId,
        severity: group.severity,
        field: group.field,
        summary: getSummaryText(group.ruleId, group.field, rowIds.length, group.fallbackMessage),
        count: rowIds.length,
        row_ids: rowIds,
        source_rows: sourceRows,
      }
    })
    .sort((a, b) => {
      const severityRank = { Critical: 3, High: 2, Medium: 1 }
      return severityRank[b.severity] - severityRank[a.severity] || b.count - a.count
    })
}

/**
 * R-02: AP Validation
 * Validates that current AP matches AIAG/VDA 5th Edition S×O×D lookup
 * CRITICAL: 100% accuracy required
 */
function checkAPValidation(row: FmeaRow): FmeaIssue | null {
  if (!hasCompleteApEvaluationInputs(row)) {
    return null
  }

  try {
    const expected = getAPFromLookup(row.severity, row.occurrence, row.detection)
    if (row.ap_current !== expected) {
      return {
        ruleId: 'R-02',
        severity: 'Critical',
        message: `AP mismatch: current "${row.ap_current}" but S${row.severity}×O${row.occurrence}×D${row.detection} should be "${expected}"`,
        field: 'ap_current',
        suggested_value: expected,
        confidence: 'High'
      }
    }
  } catch {
    return {
      ruleId: 'R-02',
      severity: 'Critical',
      message: `Invalid SxOxD combination: S${row.severity}, O${row.occurrence}, D${row.detection}`,
      field: 'ap_current',
      confidence: 'High'
    }
  }

  return null
}

/**
 * R-03: Missing Action (H AP)
 * If AP is H, action_recommended must be present
 */
function checkMissingActionHigh(row: FmeaRow): FmeaIssue | null {
  if (row.ap_current === 'H' && (!row.action_recommended || row.action_recommended.trim() === '')) {
    return {
      ruleId: 'R-03',
      severity: 'Critical',
      message: 'No action recommended for H priority item',
      field: 'action_recommended',
      confidence: 'High'
    }
  }
  return null
}

/**
 * R-04: Missing Action (M AP)
 * If AP is M, action_recommended should be present
 */
function checkMissingActionMedium(row: FmeaRow): FmeaIssue | null {
  if (row.ap_current === 'M' && (!row.action_recommended || row.action_recommended.trim() === '')) {
    return {
      ruleId: 'R-04',
      severity: 'High',
      message: 'No action recommended for M priority item',
      field: 'action_recommended',
      confidence: 'High'
    }
  }
  return null
}

/**
 * R-05: Missing Responsibility
 * If action is present, responsible party must be assigned
 */
function checkMissingResponsibility(row: FmeaRow): FmeaIssue | null {
  if (row.action_recommended && row.action_recommended.trim() !== '') {
    if (!row.responsible || row.responsible.trim() === '') {
      return {
        ruleId: 'R-05',
        severity: 'High',
        message: 'Action has no assigned responsible party',
        field: 'responsible',
        confidence: 'High'
      }
    }
  }
  return null
}

/**
 * R-06: Missing Target Date
 * If action is present, target date must be set
 */
function checkMissingTargetDate(row: FmeaRow): FmeaIssue | null {
  if (row.action_recommended && row.action_recommended.trim() !== '') {
    if (!row.target_date || row.target_date.trim() === '') {
      return {
        ruleId: 'R-06',
        severity: 'Medium',
        message: 'Action has no target completion date',
        field: 'target_date',
        confidence: 'High'
      }
    }
  }
  return null
}

/**
 * R-08: Structure Compliance
 * Reserved for future structural validations beyond mandatory fields
 * NOTE: Intentionally minimal - optional fields (failure_effect, prevention_control, 
 * detection_control, classification, special_characteristic) are not validated here
 * per Internal Data Model specification
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkStructureCompliance(row: FmeaRow): FmeaIssue | null {
  // Currently no structure-level validations
  // All mandatory field checks are in R-01
  // Conditional checks for action-related fields handled by R-03 to R-06
  return null
}

/**
 * All row-level rules in order
 * Note: R-07 (Legacy RPN) is now document-level, see validateDocumentStructure()
 */
const RULES = [
  checkMandatoryFields,
  checkAPValidation,
  checkMissingActionHigh,
  checkMissingActionMedium,
  checkMissingResponsibility,
  checkMissingTargetDate,
  // R-07 removed (now document-level via validateDocumentStructure)
  checkStructureCompliance
]

/* ────────────────────────────────────────────────────────────────── */
/*  Main Validation Engine                                            */
/* ────────────────────────────────────────────────────────────────── */

/**
 * Validate FMEA document and rows against all rules
 * Returns aggregated results with issues grouped by severity
 * 
 * Validates at two levels:
 * 1. Document-level (structural): Detects legacy methodology indicators
 * 2. Row-level: Validates individual FMEA entries
 * 
 * @param rows - Normalized FMEA rows
 * @param legacy_indicators - Document-level metadata from parser
 * @returns Validation result with combined document + row issues
 */
export async function validateFmeaRows(
  rows: FmeaRow[],
  documentContext?: DocumentValidationInput
): Promise<FmeaValidationResult> {
  const allIssues: (FmeaIssue & { row_id?: string })[] = []
  const apMismatches: Array<{ row_id: string; current_ap: APLevel; expected_ap: APLevel }> = []
  const issuesBySeverity: Record<IssueSeverity, number> = { Critical: 0, High: 0, Medium: 0 }
  const issuesByRule: Record<string, number> = {}

  // Initialize rule counts for all rules including R-07 (now document-level)
  const allRuleIds = ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08']
  allRuleIds.forEach(ruleId => {
    issuesByRule[ruleId] = 0
  })

  // ═══════════════════════════════════════════════════════════════
  // DOCUMENT-LEVEL VALIDATION
  // ═══════════════════════════════════════════════════════════════
  if (documentContext) {
    const documentIssues = validateDocumentStructure(documentContext)
    for (const issue of documentIssues) {
      // Extract the FmeaIssue part (exclude 'scope' property from document issues)
      const fmeaIssue: FmeaIssue = {
        ruleId: issue.ruleId,
        severity: issue.severity,
        message: issue.message,
        field: issue.field,
        confidence: issue.confidence,
        suggested_value: issue.suggested_value
      }
      allIssues.push(fmeaIssue)
      issuesBySeverity[fmeaIssue.severity]++
      issuesByRule[fmeaIssue.ruleId]++
    }
  }

  let rowsValid = 0
  let mandatoryFieldsFilled = 0
  let mandatoryFieldsExpected = 0
  let rowsWithCorrectAP = 0
  let rowsWithAPContext = 0
  let rowsWithIncorrectAP = 0
  let rowsWithApNotEvaluatable = 0

  // ═══════════════════════════════════════════════════════════════
  // ROW-LEVEL VALIDATION
  // ═══════════════════════════════════════════════════════════════
  for (const row of rows) {
    let rowHasIssues = false
    let hasAPMismatch = false

    // Count mandatory fields for this row
    for (const field of MANDATORY_FIELDS) {
      mandatoryFieldsExpected++
      if (isMandatoryFieldFilled(row, field)) {
        mandatoryFieldsFilled++
      }
    }

    // Run all row-level rules on this row
    for (const rule of RULES) {
      const issue = rule(row)
      if (issue) {
        rowHasIssues = true
        allIssues.push({ ...issue, row_id: row.id })
        issuesBySeverity[issue.severity]++
        issuesByRule[issue.ruleId]++

        // Track AP mismatches separately
        if (issue.ruleId === 'R-02' && issue.suggested_value) {
          apMismatches.push({
            row_id: row.id,
            current_ap: row.ap_current,
            expected_ap: issue.suggested_value as APLevel
          })
          hasAPMismatch = true
        }
      }
    }

    rowsWithAPContext++
    const apStatus = getApEvaluationStatus(row)
    if (apStatus === 'compliant' && !hasAPMismatch) {
      rowsWithCorrectAP++
    } else if (apStatus === 'not_evaluatable') {
      rowsWithApNotEvaluatable++
    } else {
      rowsWithIncorrectAP++
    }

    if (!rowHasIssues) {
      rowsValid++
    }
  }

  // Calculate completeness score (0-100%): Mandatory field population quality
  const completenessScore = mandatoryFieldsExpected > 0
    ? Math.round((mandatoryFieldsFilled / mandatoryFieldsExpected) * 100)
    : 0

  // Calculate AP compliance score (0-100%): AP correctness across all eligible PFMEA rows.
  const apComplianceScore = rowsWithAPContext > 0
    ? Math.round((rowsWithCorrectAP / rowsWithAPContext) * 100)
    : 0

  // Convert allIssues to the required type (some may not have row_id)
  const issuesWithRowId = allIssues.map(issue => {
    if ('row_id' in issue && issue.row_id !== undefined) {
      return issue as FmeaIssue & { row_id: string }
    }
    // For document-level issues without row_id, we still need to return them
    // but the type system requires row_id. Document-level issues will have row_id as empty string.
    return {
      ...issue,
      row_id: issue.row_id || 'document'
    } as FmeaIssue & { row_id: string }
  })
  const issueSummaries = buildIssueSummaries(issuesWithRowId, rows)

  return {
    rows_total: rows.length,
    rows_valid: rowsValid,
    rows_with_issues: rows.length - rowsValid,
    completeness_score: completenessScore,
    ap_compliance_score: apComplianceScore,
    issues: issuesWithRowId,
    issue_summaries: issueSummaries,
    ai_findings: [],
    ap_mismatches: apMismatches,
    statistics: {
      issues_by_severity: issuesBySeverity,
      issues_by_rule: issuesByRule,
      mandatory_fields_filled: mandatoryFieldsFilled,
      mandatory_fields_expected: mandatoryFieldsExpected,
      rows_with_correct_ap: rowsWithCorrectAP,
      rows_with_ap_context: rowsWithAPContext,
      rows_with_incorrect_ap: rowsWithIncorrectAP,
      rows_with_ap_not_evaluatable: rowsWithApNotEvaluatable
    }
  }
}

/**
 * Get rule by ID
 */
export function getRuleInfo(ruleId: string): { name: string; description: string } | null {
  const rules: Record<string, { name: string; description: string }> = {
    'R-01': {
      name: 'Mandatory Fields Present',
      description: 'All required AIAG/VDA fields must be populated: failure_mode, failure_cause, severity, occurrence, detection, ap_current'
    },
    'R-02': {
      name: 'AP Validation',
      description: 'Action Priority (AP) must match AIAG/VDA 5th Edition lookup table based on Severity × Occurrence × Detection'
    },
    'R-03': {
      name: 'Missing Action (H)',
      description: 'When AP is H, a recommended action must be documented'
    },
    'R-04': {
      name: 'Missing Action (M)',
      description: 'When AP is M, a recommended action should be documented'
    },
    'R-05': {
      name: 'Missing Responsibility',
      description: 'When an action is recommended, a responsible party must be assigned'
    },
    'R-06': {
      name: 'Missing Target Date',
      description: 'When an action is recommended, a target completion date must be set'
    },
    'R-07': {
      name: 'Legacy RPN Detected',
      description: 'Document may be using outdated RPN (Risk Priority Number) formula instead of AIAG/VDA 5th Edition AP'
    },
    'R-08': {
      name: 'Structure Compliance',
      description: 'FMEA structure must comply with AIAG/VDA 5th Edition format and field definitions'
    }
  }

  return rules[ruleId] || null
}

/**
 * Export rule statistics
 */
export function getRuleStatistics(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: 'R-01', name: 'Mandatory Fields', description: 'Critical fields present' },
    { id: 'R-02', name: 'AP Validation', description: 'Action Priority correct' },
    { id: 'R-03', name: 'Action (H)', description: 'H AP has action' },
    { id: 'R-04', name: 'Action (M)', description: 'M AP has action' },
    { id: 'R-05', name: 'Responsibility', description: 'Action assigned' },
    { id: 'R-06', name: 'Target Date', description: 'Action has due date' },
    { id: 'R-07', name: 'Legacy RPN', description: 'No outdated RPN' },
    { id: 'R-08', name: 'Structure', description: 'AIAG/VDA compliant' }
  ]
}
