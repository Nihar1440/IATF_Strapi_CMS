/**
 * FMEA Data Types — Process FMEA (PFMEA) Implementation
 * 
 * This module implements Process FMEA (PFMEA) per AIAG/VDA standard.
 * PFMEA focuses on manufacturing and production processes.
 * 
 * Key PFMEA characteristics:
 * - Focus: Process failures during manufacturing/production
 * - Prevention: Process controls to prevent occurrence
 * - Detection: Inspection/test to detect failures before shipment
 * - Severity: Impact on production, personnel, or end customer
 * 
 * Fields that distinguish PFMEA from DFMEA (Design FMEA):
 * - process_step: Manufacturing step (vs. design function in DFMEA)
 * - prevention_control: Process controls (vs. design controls in DFMEA)
 * - detection_control: Inspection/test controls (vs. design verification in DFMEA)
 * 
 * Source: AIAG/VDA Process FMEA Handbook, Appendix C
 */

export type Language = 'en' | 'de'
export type APLevel = 'H' | 'M' | 'L'
export type IssueSeverity = 'Critical' | 'High' | 'Medium'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

/**
 * Process FMEA (PFMEA) Row — Canonical schema
 * 
 * Represents a single FMEA entry (failure mode analysis row).
 * All uploaded PFMEA files are normalized to this structure.
 * 
 * AIAG/VDA PFMEA data flow:
 *   1. User uploads Excel workbook
 *   2. Parser extracts and flattens headers
 *   3. Parser normalizes each data row to FmeaRow structure
 *   4. Zod schema validates each field
 *   5. Rules engine validates S×O×D combinations against AP lookup
 *   6. AI findings generated for high-priority issues
 *   7. Results exported as PDF/XLSX report
 */
export interface FmeaRow {
  id: string
  process_step?: string
  function?: string
  failure_mode: string
  failure_effect?: string
  severity: number
  failure_cause: string
  occurrence: number
  prevention_control?: string
  detection_control?: string
  detection: number
  ap_current: APLevel
  action_recommended: string
  responsible: string
  target_date: string
  classification?: string
  special_characteristic?: string
  source_reference: {
    sheet: string
    row: number
  }
}

/**
 * Validation issue found by rules engine
 */
export interface FmeaIssue {
  ruleId: string // 'R-01', 'R-02', etc.
  severity: IssueSeverity
  message: string
  field: string
  suggested_value?: string
  confidence: ConfidenceLevel
}

/**
 * AI Finding from intelligent analysis of validation issues
 */
export interface FmeaAiFinding {
  row_id: string
  ruleId: string
  title: string
  explanation: string
  recommended_action: string
  confidence: ConfidenceLevel
}

export interface FmeaIssueSummary {
  ruleId: string
  severity: IssueSeverity
  field: string
  summary: string
  count: number
  row_ids: string[]
  source_rows: number[]
}

/**
 * Validation result from rules engine
 */
export interface FmeaValidationResult {
  rows_total: number
  rows_valid: number
  rows_with_issues: number
  completeness_score: number // 0-100%: Mandatory field population quality
  ap_compliance_score: number // 0-100%: AP correctness against AIAG/VDA lookup
  ai_findings?: FmeaAiFinding[]
  issues: (FmeaIssue & { row_id: string })[]
  issue_summaries: FmeaIssueSummary[]
  ap_mismatches: Array<{
    row_id: string
    current_ap: APLevel
    expected_ap: APLevel
  }>
  statistics: {
    issues_by_severity: Record<IssueSeverity, number>
    issues_by_rule: Record<string, number>
    mandatory_fields_filled: number // Total mandatory fields populated
    mandatory_fields_expected: number // Total expected mandatory fields
    rows_with_correct_ap: number // Rows where AP matches AIAG/VDA lookup
    rows_with_ap_context: number // All eligible PFMEA rows included in AP denominator
    rows_with_incorrect_ap: number // Rows evaluatable for AP but not compliant
    rows_with_ap_not_evaluatable: number // Rows missing S/O/D/AP inputs needed for AP lookup
  }
}

/**
 * Legacy FMEA Indicators detected at document level
 * Used by R-07 (Legacy RPN Detection) to identify pre-5th Edition workbooks
 */
export interface LegacyFmeaIndicators {
  has_rpn_header: boolean
  rpn_column_names: string[]
  rpn_detection_evidence: string[]
  has_4th_edition_terminology: boolean
  legacy_terminology_found: string[]
  has_ap_column: boolean
  missing_ap_column: boolean
  ap_column_names: string[]
  mapped_fields: string[]
}

export interface ParserMetadata {
  total_rows: number
  empty_rows: number
  scanned_rows: number
  qualified_rows: number
  skipped_rows: number
  merged_cells_flattened: number
  header_row: number
  sheet_name: string
  invalid_rows: number
}

export interface FmeaDocumentValidationContext {
  header_map: Record<string, string>
  raw_headers: string[] // All headers before mapping, for document-level validation
  unmapped_headers: string[] // Headers that don't map to canonical FmeaRow schema
  confidence: ConfidenceLevel
  warnings: string[]
  legacy_indicators: LegacyFmeaIndicators // Document-level legacy detection
  metadata: ParserMetadata
}

/**
 * Parser result with header mapping metadata
 * Includes raw headers and legacy indicators for document-level validation
 */
export interface ParserResult extends FmeaDocumentValidationContext {
  rows: FmeaRow[]
}

/**
 * Review form state (localStorage)
 */
export interface FmeaReviewFormState {
  currentStep: 'upload' | 'review' | 'export'
  stepIndex: 0 | 1 | 2
  uploadedFile: File | null
  uploadedFileName: string
  validationResult: FmeaValidationResult | null
  headerMap: Record<string, string>
  headerConfidence: ConfidenceLevel
  isLoading: boolean
  error: string | null
  createdAt: string
}

/**
 * Step definitions
 */
export const FMEA_STEPS = ['upload', 'review', 'export'] as const
export type FmeaStep = typeof FMEA_STEPS[number]

export const FMEA_STEP_NAMES: Record<FmeaStep, string> = {
  upload: 'Upload FMEA',
  review: 'Review Results',
  export: 'Export Report'
}

export const EMPTY_FMEA_FORM: FmeaReviewFormState = {
  currentStep: 'upload',
  stepIndex: 0,
  uploadedFile: null,
  uploadedFileName: '',
  validationResult: null,
  headerMap: {},
  headerConfidence: 'High',
  isLoading: false,
  error: null,
  createdAt: new Date().toISOString()
}
