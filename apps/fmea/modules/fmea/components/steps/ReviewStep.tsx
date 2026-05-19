'use client'

import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ConfidenceLevel, FmeaValidationResult, ParserResult } from '@/modules/fmea/types'

const AP_DISPLAY_LABELS = {
  H: 'High',
  M: 'Medium',
  L: 'Low',
} as const

type FmeaAiFinding = {
  row_id: string
  ruleId: string
  title: string
  explanation: string
  recommended_action: string
  confidence: ConfidenceLevel
}

function isFmeaAiFinding(value: unknown): value is FmeaAiFinding {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FmeaAiFinding>
  return (
    typeof candidate.row_id === 'string' &&
    typeof candidate.ruleId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.explanation === 'string' &&
    typeof candidate.recommended_action === 'string' &&
    typeof candidate.confidence === 'string'
  )
}

interface Props {
  validationResult: FmeaValidationResult | null
  parserWarnings?: string[]
  parserMetadata?: ParserResult['metadata'] | null
  headerMap?: Record<string, string>
  headerConfidence?: ConfidenceLevel
  language?: 'de' | 'en'
}

export function ReviewStep({
  validationResult,
  parserWarnings = [],
  parserMetadata = null,
  headerMap = {},
  headerConfidence = 'High',
  language = 'en',
}: Props) {
  const t = useTranslations('fmea')

  if (!validationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reviewStep.title', { defaultValue: 'Review Results' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('reviewStep.noResults', {
                defaultValue: 'No validation results available',
              })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const severityConfig: Record<
    string,
    { icon: React.ReactNode; color: string; bgColor: string }
  > = {
    Critical: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
    },
    High: {
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-orange-200',
    },
    Medium: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
    },
  }

  const severityLabels: Record<string, string> = {
    Critical: language === 'de' ? 'Kritisch' : 'Critical',
    High: language === 'de' ? 'Hoch' : 'High',
    Medium: language === 'de' ? 'Mittel' : 'Medium',
  }
  const aiFindings = Array.isArray(validationResult.ai_findings)
    ? validationResult.ai_findings.filter(isFmeaAiFinding)
    : []
  const issueSummaries = Array.isArray(validationResult.issue_summaries)
    ? validationResult.issue_summaries
    : []
  const apRowsTotal = validationResult.statistics.rows_with_ap_context ?? validationResult.rows_total
  const apRowsCompliant = validationResult.statistics.rows_with_correct_ap ?? 0
  const apRowsNotEvaluatable = validationResult.statistics.rows_with_ap_not_evaluatable ?? Math.max(
    0,
    apRowsTotal - apRowsCompliant - (validationResult.statistics.rows_with_incorrect_ap ?? validationResult.ap_mismatches.length)
  )
  const apRowsNonCompliant = validationResult.statistics.rows_with_incorrect_ap ?? Math.max(
    0,
    apRowsTotal - apRowsCompliant - apRowsNotEvaluatable
  )

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reviewStep.summary', { defaultValue: 'Validation Summary' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('reviewStep.totalRows')}
            </div>
            <div className="mt-2 text-2xl font-bold">
              {validationResult.rows_total}
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-sm font-medium text-green-700">
              {t('reviewStep.valid')}
            </div>
            <div className="mt-2 text-2xl font-bold text-green-700">
              {validationResult.rows_valid}
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="text-sm font-medium text-orange-700">
              {t('reviewStep.withIssues')}
            </div>
            <div className="mt-2 text-2xl font-bold text-orange-700">
              {validationResult.rows_with_issues}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('reviewStep.completeness')}
            </div>
            <div className="mt-2 text-2xl font-bold">
              {validationResult.completeness_score}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parser Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reviewStep.importDiagnostics')}
          </CardTitle>
          <CardDescription>
            {t('reviewStep.importDiagnosticsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">
                {t('reviewStep.sheet')}
              </div>
              <div className="mt-1 truncate text-sm font-semibold">
                {parserMetadata?.sheet_name ?? '-'}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">
                {t('reviewStep.headerRow')}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {parserMetadata?.header_row ?? '-'}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">
                {t('reviewStep.mapping')}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {headerConfidence}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">
                {t('reviewStep.mergedCells')}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {parserMetadata?.merged_cells_flattened ?? 0}
              </div>
            </div>
          </div>
          {Object.keys(headerMap).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(headerMap).map(([header, field]) => (
                <Badge key={`${header}-${field}`} variant="outline" className="max-w-full">
                  <span className="truncate">{header}</span>
                  <span className="mx-1 text-neutral-400">-&gt;</span>
                  <span>{field}</span>
                </Badge>
              ))}
            </div>
          )}

          {parserWarnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
              <AlertDescription className="space-y-1 text-yellow-900">
                {parserWarnings.slice(0, 6).map((warning, idx) => (
                  <div key={idx}>{warning}</div>
                ))}
                {parserWarnings.length > 6 && (
                  <div>
                    {t('reviewStep.moreWarnings')}: {parserWarnings.length - 6}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Quality Metrics - Completeness & AP Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('reviewStep.dataQuality')}
          </CardTitle>
          <CardDescription>
            {t('reviewStep.dataQualityDesc', { defaultValue: 'Separate measurements of data completeness and standards compliance' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          {/* Completeness Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('reviewStep.completenessScore')}
              </span>
              <span className="text-sm font-bold">
                {validationResult.completeness_score}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {t('reviewStep.completenessDesc', { defaultValue: 'Mandatory field population' })}
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  validationResult.completeness_score > 90
                    ? 'bg-green-500'
                    : validationResult.completeness_score > 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{
                  width: `${validationResult.completeness_score}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-600">
              {validationResult.statistics.mandatory_fields_filled} / {validationResult.statistics.mandatory_fields_expected} {t('reviewStep.fieldsPopulated', { defaultValue: 'fields' })}
            </div>
          </div>

          {/* AP Compliance Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('reviewStep.apComplianceScore')}
              </span>
              <span className="text-sm font-bold">
                {validationResult.ap_compliance_score}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {t('reviewStep.apComplianceDesc', { defaultValue: 'AIAG/VDA SÃ—OÃ—D correctness' })}
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  validationResult.ap_compliance_score > 90
                    ? 'bg-green-500'
                    : validationResult.ap_compliance_score > 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{
                  width: `${validationResult.ap_compliance_score}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-600">
              {apRowsCompliant} / {apRowsTotal} {t('reviewStep.rowsCompliant', { defaultValue: 'rows compliant' })}
            </div>
            {apRowsNotEvaluatable > 0 && (
              <div className="text-xs text-amber-700">
                {apRowsNotEvaluatable} {t('reviewStep.rowsNotEvaluatable', { defaultValue: 'not evaluatable due to missing S/O/D/AP values' })}
              </div>
            )}
            {apRowsNonCompliant > 0 && (
              <div className="text-xs text-red-700">
                {apRowsNonCompliant} {t('reviewStep.rowsNonCompliant', { defaultValue: 'non-compliant rows' })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Severity Breakdown - Aggregated Summary (matching CSR matrix style) */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reviewStep.issueSummary', { defaultValue: 'Validation Issues Summary' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-red-100 text-red-700 text-xs">
              {t('reviewStep.critical', { defaultValue: 'Critical' })}: {validationResult.statistics.issues_by_severity.Critical}
            </Badge>
            <Badge className="bg-orange-100 text-orange-700 text-xs">
              {t('reviewStep.high', { defaultValue: 'High' })}: {validationResult.statistics.issues_by_severity.High}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">
              {t('reviewStep.medium', { defaultValue: 'Medium' })}: {validationResult.statistics.issues_by_severity.Medium}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Validation Findings - Unified Section */}
      {(issueSummaries.length > 0 || validationResult.issues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('reviewStep.validationFindings', { defaultValue: 'Validation Findings' })}
            </CardTitle>
            <CardDescription>
              {issueSummaries.length > 0
                ? `${issueSummaries.length} ${issueSummaries.length === 1 ? 'rule' : 'rules'} with findings`
                : validationResult.issues.length > 0
                  ? `${validationResult.issues.length} validation issues detected`
                  : 'No findings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Grouped findings from issue summaries */}
            {issueSummaries.length > 0 && issueSummaries.map((summary, idx) => {
              const config = severityConfig[summary.severity] || severityConfig.Medium
              const rowsText = summary.source_rows.length > 0
                ? summary.source_rows.join(', ')
                : summary.row_ids.join(', ')
              const affectedRowCount = summary.source_rows.length || summary.row_ids.length

              return (
                <details key={`${summary.ruleId}-${summary.field}-${idx}`} className={`rounded-md border p-3 ${config.bgColor}`}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        {summary.ruleId}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {summary.field}
                      </Badge>
                      <span className="text-sm font-medium text-neutral-900">
                        {summary.summary}
                      </span>
                      <span className="ml-auto text-xs text-neutral-600">
                        {affectedRowCount} {affectedRowCount === 1 ? 'row' : 'rows'}
                      </span>
                    </div>
                  </summary>
                  <div className="mt-3 space-y-2 text-xs text-neutral-700">
                    <div className="font-medium">Affected rows:</div>
                    <div className="break-all">{rowsText}</div>
                  </div>
                </details>
              )
            })}

            {/* Fallback: individual row-level issues if no summaries available */}
            {issueSummaries.length === 0 && validationResult.issues.length > 0 && (
              <details className="w-full">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                  {validationResult.issues.length} row-level findings
                </summary>
                <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                  {validationResult.issues.slice(0, 100).map((issue, idx) => {
                    const config = severityConfig[issue.severity] || severityConfig.Medium
                    const severityLabel = severityLabels[issue.severity] || issue.severity

                    return (
                      <Alert key={idx} className={`${config.bgColor} border`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {severityLabel}
                              </Badge>
                              {issue.field && (
                                <Badge variant="secondary" className="text-xs">
                                  {issue.field}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-medium">
                              {issue.message}
                            </p>
                            {issue.suggested_value && (
                              <p className="mt-1 text-xs text-gray-600">
                                {t('reviewStep.suggestion')}
                                : {issue.suggested_value}
                              </p>
                            )}
                          </div>
                        </div>
                      </Alert>
                    )
                  })}

                  {validationResult.issues.length > 100 && (
                    <p className="text-xs text-gray-500">
                      ... and{' '}
                      {validationResult.issues.length - 100}{' '}
                      {t('reviewStep.moreIssues')}
                    </p>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {aiFindings.length > 0 && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
          <div className="mb-4 flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">
                {t('reviewStep.aiFindings')}
              </p>
              <p className="mt-1 text-xs text-purple-700">
                {t('reviewStep.aiFindingsDesc')}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {aiFindings.map((finding, idx) => (
              <div key={`${finding.row_id}-${finding.ruleId}-${idx}`} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {finding.ruleId}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {finding.row_id}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {finding.confidence}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{finding.title}</h4>
                <p className="mt-2 text-sm text-gray-700">{finding.explanation}</p>
                <p className="mt-2 text-sm font-medium text-gray-800">{finding.recommended_action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AP Mismatches */}
      {validationResult.ap_mismatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('reviewStep.apMismatches')}
            </CardTitle>
            <CardDescription>
              {validationResult.ap_mismatches.length}{' '}
              {t('reviewStep.apMismatchDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResult.ap_mismatches.map((mismatch, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="text-sm font-medium">{mismatch.row_id}</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {mismatch.current_ap} ({AP_DISPLAY_LABELS[mismatch.current_ap]})
                    </Badge>
                    <span className="text-xs text-neutral-500">→</span>
                    <Badge>{mismatch.expected_ap} ({AP_DISPLAY_LABELS[mismatch.expected_ap]})</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {validationResult.issues.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('reviewStep.allPassed')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
