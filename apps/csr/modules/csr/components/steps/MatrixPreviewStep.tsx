'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, AlertTriangle, CheckCircle, Sparkles, RefreshCw, Brain, Info, GitCompare, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { MatrixRow, ProcessEntry, OemId, ConflictInfo, ImplementationRecord, ImplementationStatus } from '../../types'
import { getOemName } from '../../data'
import { handleUnauthorized } from '@/lib/session/client'

const IMPL_STATUSES: ImplementationStatus[] = ['open', 'in_review', 'implemented', 'validated']
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_ROWS_PER_PAGE = 25

interface Props {
  selectedOems: OemId[]
  processes: ProcessEntry[]
  matrixRows: MatrixRow[]
  conflicts: ConflictInfo[]
  insights: string[]
  aiPowered: boolean
  implementationRecords: Record<string, ImplementationRecord>
  onImplementationChange: (csrId: string, record: ImplementationRecord) => void
  onMatrixGenerated: (rows: MatrixRow[], conflicts: ConflictInfo[], insights: string[], aiPowered: boolean) => void
  onNext: () => void
  onBack: () => void
  language: 'en' | 'de'
}

export function MatrixPreviewStep({
  selectedOems,
  processes,
  matrixRows,
  conflicts,
  insights,
  aiPowered,
  implementationRecords,
  onImplementationChange,
  onMatrixGenerated,
  onNext,
  onBack,
  language,
}: Props) {
  const t = useTranslations('csr')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(matrixRows.length > 0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<{
    updates: number
    sanctionedInterpretations: number
    disclaimer: string
  } | null>(null)
  const [deltaRunning, setDeltaRunning] = useState(false)
  const [deltaResult, setDeltaResult] = useState<{
    newCount: number
    changedCount: number
    removedCount: number
  } | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [deltaError, setDeltaError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE)
  const [jumpToInput, setJumpToInput] = useState('')

  const generate = useCallback(async () => {
    setGenerating(true)
    setGenerationError(null)
    try {
      const res = await fetch('/api/csr/generate-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          oems: selectedOems,
          processes,
          language,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      console.log(data, "wwwwww")
      onMatrixGenerated(data.matrixRows, data.conflicts ?? [], data.insights ?? [], data.aiPowered ?? false)
      setGenerated(true)
    } catch (err) {
      console.error('[MatrixPreview] Generation error:', err)
      setGenerationError(err instanceof Error ? err.message : 'Matrix generation failed. Please try again.')
      // Mark as generated to stop the infinite retry loop
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }, [selectedOems, processes, language, onMatrixGenerated])

  useEffect(() => {
    if (!generated && !generating) {
      generate()
    }
  }, [generated, generating, generate])

  const handleRefreshData = useCallback(async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await fetch('/api/csr/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'refresh-data',
          oems: selectedOems,
          language,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) throw new Error('Refresh failed')

      const data = await res.json()
      setRefreshResult({
        updates: data.updates?.length ?? 0,
        sanctionedInterpretations: data.sanctionedInterpretations?.length ?? 0,
        disclaimer: data.disclaimer ?? '',
      })
    } catch (err) {
      console.error('[MatrixPreview] Refresh error:', err)
      setRefreshError(err instanceof Error ? err.message : 'Data refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }, [selectedOems, language])

  const handleDeltaCheck = useCallback(async () => {
    setDeltaRunning(true)
    try {
      const res = await fetch('/api/csr/delta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oems: selectedOems }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) throw new Error('Delta failed')

      const data = await res.json()
      setDeltaResult({
        newCount: data.newRequirements?.length ?? 0,
        changedCount: data.changedRequirements?.length ?? 0,
        removedCount: data.removedRequirements?.length ?? 0,
      })
    } catch (err) {
      console.error('[MatrixPreview] Delta error:', err)
      setDeltaError(err instanceof Error ? err.message : 'Delta check failed. Please try again.')
    } finally {
      setDeltaRunning(false)
    }
  }, [selectedOems])

  // Stats
  const totalRows = matrixRows.length
  const byOem = new Map<string, number>()
  const byRisk = { low: 0, medium: 0, high: 0, critical: 0 }
  const unmapped: MatrixRow[] = []
  for (const row of matrixRows) {
    byOem.set(row.oem, (byOem.get(row.oem) ?? 0) + 1)
    byRisk[row.risk]++
    if (row.affectedProcessIds.length === 0) {
      unmapped.push(row)
    }
  }

  // Pagination calculations
  const totalPages = rowsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === 0) return matrixRows // "Show All"
    const start = (safePage - 1) * rowsPerPage
    return matrixRows.slice(start, start + rowsPerPage)
  }, [matrixRows, safePage, rowsPerPage])

  // Reset page when rows change
  useEffect(() => {
    setCurrentPage(1)
  }, [totalRows])

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleRowsPerPageChange = (value: string | null) => {
    if (!value) return
    const v = value === 'all' ? 0 : parseInt(value, 10)
    setRowsPerPage(v)
    setCurrentPage(1)
  }

  const handleJumpToPage = () => {
    const page = parseInt(jumpToInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setJumpToInput('')
    }
  }

  if (generating) {
    return (
      <div className="flex min-h-[200px] sm:min-h-[300px] items-center justify-center">
        <div className="flex items-center r-gap-sm rounded-lg border border-neutral-200 bg-white r-px r-py-sm r-text-sm text-neutral-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('generatingMatrixAI')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="r-space-y-section">
      {/* Generation Error Banner */}
      {generationError && (
        <div className="flex items-center r-gap-sm rounded-lg border border-red-200 bg-red-50 r-px r-py-sm r-text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{generationError}</span>
          <Button variant="outline" size="sm" className="ml-auto r-text-xs" onClick={() => { setGenerated(false); setGenerationError(null) }}>
            {t('retry') ?? 'Retry'}
          </Button>
        </div>
      )}

      {/* Refresh Error Banner */}
      {refreshError && (
        <div className="flex items-center r-gap-sm rounded-lg border border-red-200 bg-red-50 r-px r-py-sm r-text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Delta Error Banner */}
      {deltaError && (
        <div className="flex items-center r-gap-sm rounded-lg border border-red-200 bg-red-50 r-px r-py-sm r-text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{deltaError}</span>
        </div>
      )}

      {/* AI Status Banner */}
      {generated && (
        <div className={`flex items-center r-gap-xs rounded-lg border r-px r-py-sm r-text-sm ${aiPowered
          ? 'border-purple-200 bg-purple-50 text-purple-700'
          : 'border-neutral-200 bg-neutral-50 text-neutral-600'
          }`}>
          {aiPowered ? (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{t('aiPoweredBanner')}</span>
            </>
          ) : (
            <>
              <Info className="h-4 w-4" />
              <span>{t('staticFallbackBanner')}</span>
            </>
          )}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center r-gap-xs r-text-lg">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            {t('matrixGenerated')}
          </CardTitle>
          <CardDescription className="r-text-sm">
            {t('matrixSummary', { rows: totalRows, oems: selectedOems.length, processes: processes.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OEM breakdown */}
          <div className="r-mb">
            <p className="r-mb-sm r-text-sm font-medium text-neutral-700">{t('byOem')}</p>
            <div className="flex flex-wrap r-gap-xs">
              {Array.from(byOem.entries()).map(([oem, count]) => (
                <Badge key={oem} variant="outline" className="r-text-xs">
                  {oem === 'IATF 16949' ? oem : getOemName(oem)} — {count}
                </Badge>
              ))}            </div>
          </div>

          {/* Risk breakdown */}
          <div className="r-mb">
            <p className="r-mb-sm r-text-sm font-medium text-neutral-700">{t('byRisk')}</p>
            <div className="flex flex-wrap r-gap-xs">
              <Badge className="bg-red-100 text-red-700 r-text-xs">{t('critical')}: {byRisk.critical}</Badge>
              <Badge className="bg-orange-100 text-orange-700 r-text-xs">{t('high')}: {byRisk.high}</Badge>
              <Badge className="bg-yellow-100 text-yellow-700 r-text-xs">{t('medium')}: {byRisk.medium}</Badge>
              <Badge className="bg-green-100 text-green-700 r-text-xs">{t('low')}: {byRisk.low}</Badge>
            </div>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="r-mb rounded-md border border-purple-200 bg-purple-50 r-p-sm">
              <div className="r-mb-sm flex items-center r-gap-xs">
                <Brain className="h-4 w-4 text-purple-600" />
                <p className="r-text-sm font-medium text-purple-800">{t('aiInsights')}</p>
              </div>
              <ul className="r-space-y-sm">
                {insights.map((insight, i) => (
                  <li key={i} className="r-text-xs text-purple-700">• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unmapped warning */}
          {unmapped.length > 0 && (
            <div className="r-mb flex items-start r-gap-xs rounded-md bg-amber-50 r-p-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="r-text-sm font-medium text-amber-800">{t('unmappedWarning', { count: unmapped.length })}</p>
                <p className="r-text-xs text-amber-600">{t('unmappedHint')}</p>
              </div>
            </div>
          )}

          {/* Conflicts warning */}
          {conflicts.length > 0 && (
            <div className="flex items-start r-gap-xs rounded-md bg-yellow-50 border border-yellow-200 r-p-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <div>
                <p className="r-text-sm font-medium text-yellow-800">
                  {t('conflictsDetected', { count: conflicts.length })}
                </p>
                <ul className="r-mt-sm r-space-y-sm">
                  {conflicts.map((c) => (
                    <li key={c.iatfChapter} className="r-text-xs text-yellow-700">
                      <span className="font-mono font-medium">{c.iatfChapter}</span> — {c.oems.join(', ')}
                    </li>
                  ))}
                </ul>
                <p className="r-mt-sm r-text-xs text-yellow-600">{t('conflictsHint')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Refresh Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center r-gap-xs r-text-base">
            <RefreshCw className="h-4 w-4" />
            {t('refreshDataTitle')}
          </CardTitle>
          <CardDescription className="r-text-sm">{t('refreshDataDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={refreshing}
            className="r-gap-xs r-text-xs"
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {refreshing ? t('refreshing') : t('checkForUpdates')}
          </Button>

          {refreshResult && (
            <div className="r-mt-sm rounded-md border border-blue-200 bg-blue-50 r-p-sm">
              <p className="r-text-sm text-blue-800">
                {t('refreshResult', {
                  updates: refreshResult.updates,
                  sis: refreshResult.sanctionedInterpretations,
                })}
              </p>
              {refreshResult.disclaimer && (
                <p className="r-mt-sm r-text-xs text-blue-600">{refreshResult.disclaimer}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delta Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center r-gap-xs r-text-base">
            <GitCompare className="h-4 w-4" />
            {t('deltaTitle')}
          </CardTitle>
          <CardDescription className="r-text-sm">{t('deltaDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeltaCheck}
            disabled={deltaRunning}
            className="r-gap-xs r-text-xs"
          >
            {deltaRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitCompare className="h-3.5 w-3.5" />
            )}
            {deltaRunning ? t('runningDelta') : t('runDelta')}
          </Button>

          {deltaResult && (
            <div className="r-mt-sm rounded-md border border-emerald-200 bg-emerald-50 r-p-sm">
              {deltaResult.newCount === 0 && deltaResult.changedCount === 0 && deltaResult.removedCount === 0 ? (
                <p className="r-text-sm text-emerald-800">{t('deltaNone')}</p>
              ) : (
                <div className="r-space-y-sm r-text-sm text-emerald-800">
                  {deltaResult.newCount > 0 && (
                    <p>+ {t('deltaNewReqs', { count: deltaResult.newCount })}</p>
                  )}
                  {deltaResult.changedCount > 0 && (
                    <p>~ {t('deltaChangedReqs', { count: deltaResult.changedCount })}</p>
                  )}
                  {deltaResult.removedCount > 0 && (
                    <p>– {t('deltaRemovedReqs', { count: deltaResult.removedCount })}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix preview table */}
      <Card>
        <CardHeader>
          <CardTitle className="r-text-lg">{t('matrixPreview')}</CardTitle>
          <CardDescription className="r-text-sm">
            {rowsPerPage === 0
              ? t('matrixPreviewDesc', { showing: totalRows, total: totalRows })
              : t('matrixPreviewDesc', { showing: paginatedRows.length, total: totalRows })
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center r-gap-xs rounded-md border border-blue-200 bg-blue-50 r-p-sm text-blue-800">
              <Info className="h-4 w-4 shrink-0" />
              <span className="r-text-xs">{t('manualEntryHint')}</span>
            </div>
            <div className="flex items-center r-gap-xs rounded-md border border-amber-200 bg-amber-50 r-p-sm text-amber-800">
              <RefreshCw className="h-4 w-4 shrink-0" />
              <span className="r-text-xs">{t('regenerationHint')}</span>
            </div>
          </div>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full r-text-xs" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colChapter')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colTitle')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colOem')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colRisk')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colProcesses')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colImplStatus')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colProcessOwner')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colDocRef')}</th>
                  <th className="r-px-sm r-py-sm text-left font-medium text-neutral-600">{t('colEvidenceLocation')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr
                    key={row.csrId}
                    className={`border-b border-neutral-100 ${row.conflictFlag ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="r-px-sm py-1.5 font-mono text-neutral-700">
                      {row.iatfChapter}
                      {row.conflictFlag && <span className="ml-1 text-yellow-600">⚠</span>}
                    </td>
                    <td className="max-w-[200px] truncate r-px-sm py-1.5 text-neutral-600">{row.title}</td>
                    <td className="r-px-sm py-1.5 text-neutral-500">{row.oem}</td>
                    <td className="r-px-sm py-1.5">
                      <Badge
                        variant="outline"
                        className={
                          row.risk === 'critical'
                            ? 'border-red-300 text-red-700'
                            : row.risk === 'high'
                              ? 'border-orange-300 text-orange-700'
                              : row.risk === 'medium'
                                ? 'border-yellow-300 text-yellow-700'
                                : 'border-green-300 text-green-700'
                        }
                      >
                        {row.risk}
                      </Badge>
                    </td>
                    <td className="r-px-sm py-1.5 text-neutral-500">
                      {row.affectedProcessIds.length > 0
                        ? row.affectedProcessIds
                          .map((pid) => {
                            const p = processes?.find((pr) => pr.id === pid)
                            return p?.name ?? pid
                          })
                          .join(', ')
                        : '—'}
                    </td>
                    <td className="r-px-sm py-1.5">
                      {(() => {
                        const existing = implementationRecords[row.csrId]
                        return (
                          <Select
                            value={existing?.status ?? 'open'}
                            onValueChange={(v) =>
                              onImplementationChange(row.csrId, {
                                ...existing,
                                csrId: row.csrId,
                                processId: row.affectedProcessIds[0] ?? '',
                                status: v as ImplementationStatus,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-[100px] sm:w-[120px] r-text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMPL_STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="r-text-xs">
                                  {t(`implStatus_${s}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      })()}
                    </td>
                    <td className="r-px-sm py-1.5">
                      <Input
                        value={
                          implementationRecords[row.csrId]?.processOwner ??
                          implementationRecords[row.csrId]?.assignee ??
                          (row.affectedProcessIds.length > 0 ? processes?.find((pr) => pr.id === row.affectedProcessIds[0])?.owner ?? '' : '')
                        }
                        onChange={(e) =>
                          onImplementationChange(row.csrId, {
                            ...implementationRecords[row.csrId],
                            csrId: row.csrId,
                            processId: row.affectedProcessIds[0] ?? '',
                            status: implementationRecords[row.csrId]?.status ?? 'open',
                            processOwner: e.target.value,
                            assignee: e.target.value,
                          })
                        }
                        placeholder={t('processOwnerPh')}
                        className="h-7 w-[120px] sm:w-[150px] r-text-xs"
                      />
                    </td>
                    <td className="r-px-sm py-1.5">
                      <Input
                        value={implementationRecords[row.csrId]?.documentReference ?? ''}
                        onChange={(e) =>
                          onImplementationChange(row.csrId, {
                            ...implementationRecords[row.csrId],
                            csrId: row.csrId,
                            processId: row.affectedProcessIds[0] ?? '',
                            status: implementationRecords[row.csrId]?.status ?? 'open',
                            documentReference: e.target.value,
                          })
                        }
                        placeholder={t('docRefPh')}
                        className="h-7 w-[130px] sm:w-[170px] r-text-xs"
                      />
                    </td>
                    <td className="r-px-sm py-1.5">
                      <Input
                        value={implementationRecords[row.csrId]?.evidenceLocation ?? ''}
                        onChange={(e) =>
                          onImplementationChange(row.csrId, {
                            ...implementationRecords[row.csrId],
                            csrId: row.csrId,
                            processId: row.affectedProcessIds[0] ?? '',
                            status: implementationRecords[row.csrId]?.status ?? 'open',
                            evidenceLocation: e.target.value,
                          })
                        }
                        placeholder={t('evidenceLocationPh')}
                        className="h-7 w-[140px] sm:w-[180px] r-text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalRows > 0 && (
            <div className="r-mt flex flex-col r-gap-sm sm:flex-row sm:items-center sm:justify-between">
              {/* Rows per page selector */}
              <div className="flex items-center r-gap-xs r-text-xs text-neutral-500">
                <span>{t('paginationRowsPerPage') ?? 'Rows per page'}:</span>
                <Select
                  value={rowsPerPage === 0 ? 'all' : String(rowsPerPage)}
                  onValueChange={handleRowsPerPageChange}
                >
                  <SelectTrigger className="h-7 w-[80px] r-text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={String(opt)} className="r-text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                    <SelectItem value="all" className="r-text-xs">
                      {t('paginationShowAll') ?? 'All'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page navigation */}
              {rowsPerPage !== 0 && totalPages > 1 && (
                <div className="flex items-center r-gap-xs flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handlePageChange(1)}
                    disabled={safePage <= 1}
                    aria-label="First page"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handlePageChange(safePage - 1)}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  <span className="mx-1 r-text-xs text-neutral-600">
                    {t('paginationPage', { current: safePage, total: totalPages }) ?? `Page ${safePage} of ${totalPages}`}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handlePageChange(safePage + 1)}
                    disabled={safePage >= totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={safePage >= totalPages}
                    aria-label="Last page"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>

                  {/* Jump to page */}
                  {totalPages > 5 && (
                    <div className="ml-2 flex items-center r-gap-xs">
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpToInput}
                        onChange={(e) => setJumpToInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleJumpToPage() }}
                        placeholder="#"
                        className="h-7 w-[50px] r-text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 r-text-xs px-2"
                        onClick={handleJumpToPage}
                      >
                        {t('paginationGoToPage') ?? 'Go'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Row count summary */}
              <span className="r-text-xs text-neutral-400">
                {rowsPerPage === 0
                  ? t('showingXofY', { x: totalRows, y: totalRows })
                  : t('showingXofY', {
                    x: `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, totalRows)}`,
                    y: totalRows,
                  })
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between r-gap-sm">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto r-text-sm">
          {t('backProcessMap')}
        </Button>
        <div className="flex items-center r-gap-sm w-full sm:w-auto">
          <Button variant="outline" onClick={() => { setGenerated(false); generate() }} className="flex-1 sm:flex-none r-text-sm">
            {t('regenerate')}
          </Button>
          <Button onClick={onNext} disabled={matrixRows.length === 0} className="flex-1 sm:flex-none r-text-sm">
            {t('nextExport')}
          </Button>
        </div>
      </div>
    </div>
  )
}
