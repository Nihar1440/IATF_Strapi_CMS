'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Loader2, RotateCcw, CheckCircle, FileText, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { CsrFormState, ConflictInfo } from '../../types'
import { handleUnauthorized } from '@/lib/session/client'

interface Props {
  form: CsrFormState
  conflicts: ConflictInfo[]
  onReset: () => void
}

export function ExportStep({ form, conflicts, onReset }: Props) {
  const t = useTranslations('csr')
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadedPdf, setDownloadedPdf] = useState(false)
  const [dialogFormat, setDialogFormat] = useState<'pdf' | 'xlsx' | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

  function handleDownload() {
    // open language selection dialog for XLSX
    setDialogFormat('xlsx')
  }

  function handleDownloadPdf() {
    // open language selection dialog for PDF
    setDialogFormat('pdf')
  }

  async function performDownload(format: 'pdf' | 'xlsx', targetLanguage: 'en' | 'de') {
    if (format === 'xlsx') setDownloading(true)
    else setDownloadingPdf(true)
    setTranslationError(null)
    let translationFailed = false

    try {
      // Matrix content language is the site/form language.
      // Translate via AI when the download language differs from the content language.
      const contentLanguage = form.language
      let exportRows = form.matrixRows
      let exportProcesses = form.processes
      let exportConflicts = conflicts
      let exportInsights = form.insights || []
      let exportRecords = form.implementationRecords

      if (targetLanguage !== contentLanguage) {
        setTranslating(true)
        try {
          console.log('[ExportStep] Translating matrix content from', contentLanguage, 'to', targetLanguage)
          const translateRes = await fetch('/api/csr/translate-matrix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              matrixRows: form.matrixRows,
              processes: form.processes,
              conflicts,
              insights: form.insights,
              implementationRecords: form.implementationRecords,
              sourceLanguage: contentLanguage,
              targetLanguage,
            }),
          })

          if (translateRes.status === 401) {
            handleUnauthorized()
            return
          }

          if (!translateRes.ok) {
            const errBody = await translateRes.json().catch(() => ({ error: 'Translation failed' }))
            throw new Error(errBody.error ?? 'Translation failed')
          }

          const translateData = await translateRes.json()
          if (!translateData.matrixRows || translateData.matrixRows.length === 0) {
            throw new Error('Translation returned empty data')
          }
          console.log('[ExportStep] Translation complete, got', translateData.matrixRows.length, 'rows')
          exportRows = translateData.matrixRows
          if (translateData.processes) exportProcesses = translateData.processes
          if (translateData.conflicts) exportConflicts = translateData.conflicts
          if (translateData.insights) exportInsights = translateData.insights
          if (translateData.implementationRecords) exportRecords = translateData.implementationRecords
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Translation failed'
          console.error('[ExportStep] Translation error:', errorMsg)
          setTranslationError(errorMsg)
          // Continue exporting original content but mark that translation failed
          translationFailed = true
          toast.error(t('translationFailedProceeding') ?? 'Translation failed — exporting original language')
        } finally {
          setTranslating(false)
        }
      }

      const endpoint = format === 'xlsx' ? '/api/csr/export-xlsx' : '/api/csr/export-pdf'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          matrixRows: exportRows,
          processes: exportProcesses,
          selectedOems: form.selectedOems,
          companyName: form.companyName,
          companyLocation: form.companyLocation,
          language: targetLanguage,
          translationFailed,
          conflicts: exportConflicts,
          insights: exportInsights,
          implementationRecords: exportRecords,
          companyLogo: form.companyLogo,
          processMapImage: form.processMapImage,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }))
        toast.error(err.error ?? t('exportError'))
        return
      }

      const blob = await res.blob()
      const datePart = new Date().toISOString().slice(0, 10)
      const namePart = form.companyName
        ? form.companyName.replace(/[^a-zA-Z0-9_-]/g, '_')
        : 'Matrix'
      const filename = format === 'xlsx'
        ? `CSR_Matrix_${namePart}_${datePart}.xlsx`
        : `CSR_Summary_${namePart}_${datePart}.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      if (format === 'xlsx') setDownloaded(true)
      else setDownloadedPdf(true)
      toast.success(t('exportSuccess'))
      setDialogFormat(null)
    } catch {
      toast.error(t('exportError'))
    } finally {
      if (format === 'xlsx') setDownloading(false)
      else setDownloadingPdf(false)
    }
  }

  return (
    <div className="r-space-y-section">
      <Card>
        <CardHeader>
          <CardTitle className="r-text-lg">{t('exportTitle')}</CardTitle>
          <CardDescription className="r-text-sm">{t('exportDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="r-space-y">
          {/* Summary */}
          <div className="rounded-md bg-neutral-50 r-p r-text-sm text-neutral-600">
            <p>
              <strong>{t('totalRequirements')}:</strong> {form.matrixRows.length}
            </p>
            <p>
              <strong>{t('oemsSelected')}:</strong> {form.selectedOems.join(', ')}
            </p>
            <p>
              <strong>{t('processCount')}:</strong> {form.processes.length}
            </p>
            <p>
              <strong>{t('outputLanguage')}:</strong> {form.language === 'de' ? 'Deutsch' : 'English'}
            </p>
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full r-text-sm"
            size="lg"
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : downloaded ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('downloadAgain')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('downloadXlsx')}
              </>
            )}
          </Button>

          {/* PDF Download button */}
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            variant="outline"
            className="w-full r-text-sm"
            size="lg"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : downloadedPdf ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('downloadAgain')}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {t('downloadPdf')}
              </>
            )}
          </Button>

          {/* Expiry notice */}
          <Alert>
            <AlertDescription className="r-text-xs text-neutral-500">
              {t('expiryNotice')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onReset} className="r-text-sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('startOver')}
        </Button>
      </div>
      <AlertDialog open={dialogFormat !== null} onOpenChange={(open) => { if (!open) { setDialogFormat(null); setTranslationError(null) } }}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <div className="r-mb-sm inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Languages className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="r-text-lg">{t('languageDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="r-text-sm">
              {t('languageDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid r-gap-xs">
            {/* Primary: current site language; Secondary: the other language (AI if translation needed) */}
            {(() => {
              const primary: 'en' | 'de' = form.language === 'de' ? 'de' : 'en'
              const secondary: 'en' | 'de' = primary === 'de' ? 'en' : 'de'
              const primaryLabel = primary === 'de' ? t('languageGerman') : t('languageEnglish')
              const secondaryLabel = secondary === 'de' ? t('languageGerman') : t('languageEnglish')
              const primaryNeedsAI = primary !== 'en'
              const secondaryNeedsAI = secondary !== 'en'

              return (
                <>
                  <Button
                    variant="default"
                    disabled={!dialogFormat || translating || downloading || downloadingPdf}
                    onClick={() => dialogFormat && performDownload(dialogFormat, primary)}
                    className="r-text-sm"
                  >
                    {primaryLabel}{primaryNeedsAI ? <span className="ml-1 r-text-xs opacity-70">(AI)</span> : null}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!dialogFormat || translating || downloading || downloadingPdf}
                    onClick={() => dialogFormat && performDownload(dialogFormat, secondary)}
                    className="r-text-sm"
                  >
                    {secondaryLabel}{secondaryNeedsAI ? <span className="ml-1 r-text-xs opacity-70">(AI)</span> : null}
                  </Button>
                </>
              )
            })()}
          </div>

          {/* Translation / download status */}
          {(translating || downloading || downloadingPdf) && (
            <div className="flex items-center r-gap-xs rounded-md border border-neutral-200 bg-neutral-50 r-px r-py-sm r-text-xs text-neutral-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>{translating ? t('translatingForDownload') : t('generating')}</span>
            </div>
          )}

          {/* Translation error */}
          {translationError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 r-px r-py-sm r-text-xs text-amber-700">
              {translationError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="r-text-sm">{t('languageDialogCancel') ?? 'Cancel'}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
