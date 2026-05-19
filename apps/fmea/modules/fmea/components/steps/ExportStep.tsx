'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FileSpreadsheet, Loader2, FileText, Languages, RotateCcw, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import type { FmeaValidationResult, FmeaRow } from '@/modules/fmea/types'
import { handleUnauthorized } from '@/lib/session/client'

interface Props {
  validationResult: FmeaValidationResult | null
  rows: FmeaRow[]
  originalWorkbookBase64: string
  language?: 'de' | 'en'
  onReset: () => void
}

export function ExportStep({
  validationResult,
  rows,
  originalWorkbookBase64,
  language = 'en',
  onReset,
}: Props) {
  const t = useTranslations('fmea')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadedPdf, setDownloadedPdf] = useState(false)
  const [downloadingXlsx, setDownloadingXlsx] = useState(false)
  const [downloadedXlsx, setDownloadedXlsx] = useState(false)
  const [dialogFormat, setDialogFormat] = useState<'pdf' | 'xlsx' | null>(null)
  const [translating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

  function handleDownloadPdf() {
    setDialogFormat('pdf')
  }

  function handleDownloadXlsx() {
    setDialogFormat('xlsx')
  }

  async function performDownload(format: 'pdf' | 'xlsx', targetLanguage: 'en' | 'de') {
    if (format === 'pdf') setDownloadingPdf(true)
    else setDownloadingXlsx(true)
    setTranslationError(null)

    try {
      const endpoint = format === 'pdf' ? '/api/fmea/export-pdf' : '/api/fmea/export-xlsx'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          validationResult,
          rows,
          originalWorkbookBase64: format === 'pdf' ? originalWorkbookBase64 : undefined,
          language: targetLanguage,
        }),
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate file')
      }

      const blob = await response.blob()
      const datePart = new Date().toISOString().slice(0, 10)
      const filename = format === 'pdf'
        ? `fmea-review-${datePart}.pdf`
        : `fmea-review-${datePart}.xlsx`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (format === 'pdf') setDownloadedPdf(true)
      else setDownloadedXlsx(true)
      
      toast.success(
        format === 'pdf'
          ? t('exportStep.pdfSuccess', { defaultValue: 'PDF exported successfully' })
          : t('exportStep.xlsxSuccess', { defaultValue: 'Excel file exported successfully' })
      )
      setDialogFormat(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export file'
      toast.error(message)
    } finally {
      if (format === 'pdf') setDownloadingPdf(false)
      else setDownloadingXlsx(false)
    }
  }

  return (
    <div className="r-space-y-section">
      <Card>
        <CardHeader>
          <CardTitle className="r-text-lg">
            {t('exportStep.title', { defaultValue: 'Export Results' })}
          </CardTitle>
          <CardDescription className="r-text-sm">
            {t('exportStep.description', {
              defaultValue: 'Download your FMEA review results in various formats',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="r-space-y">
          {/* Summary */}
          <div className="rounded-md bg-neutral-50 r-p r-text-sm text-neutral-600">
            <p>
              <strong>{t('exportStep.totalRows', { defaultValue: 'Total Rows' })}:</strong> {validationResult?.rows_total}
            </p>
            <p>
              <strong>{t('exportStep.validRows', { defaultValue: 'Valid Rows' })}:</strong> {validationResult?.rows_valid}
            </p>
            <p>
              <strong>{t('exportStep.rowsWithIssues', { defaultValue: 'Rows with Issues' })}:</strong> {validationResult?.rows_with_issues}
            </p>
            <p>
              <strong>{t('exportStep.completenessScore', { defaultValue: 'Completeness Score' })}:</strong> {validationResult?.completeness_score}%
            </p>
            <p>
              <strong>{t('exportStep.apComplianceScore', { defaultValue: 'AP Compliance Score' })}:</strong> {validationResult?.ap_compliance_score}%
            </p>
          </div>

          {/* Download buttons */}
          <Button
            onClick={handleDownloadXlsx}
            disabled={downloadingXlsx || downloadingPdf}
            className="w-full r-text-sm"
            size="lg"
          >
            {downloadingXlsx ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exportStep.generating', { defaultValue: 'Generating' })}
              </>
            ) : downloadedXlsx ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('exportStep.downloadAgain', { defaultValue: 'Download Again' })}
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t('exportStep.downloadXlsx', { defaultValue: 'Download Excel File' })}
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || downloadingXlsx}
            variant="outline"
            className="w-full r-text-sm"
            size="lg"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exportStep.generating', { defaultValue: 'Generating' })}
              </>
            ) : downloadedPdf ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('exportStep.downloadAgain', { defaultValue: 'Download Again' })}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {t('exportStep.downloadPdf', { defaultValue: 'Download PDF Report' })}
              </>
            )}
          </Button>

          <Alert>
            <AlertDescription className="r-text-xs text-neutral-500">
              {t('exportStep.note', {
                defaultValue:
                  'Your results are available for download. The review can be repeated with different files.',
              })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onReset} className="r-text-sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('exportStep.startOver', { defaultValue: 'Start Over' })}
        </Button>
      </div>

      {/* Language Selection Dialog */}
      <AlertDialog open={dialogFormat !== null} onOpenChange={(open) => { if (!open) { setDialogFormat(null); setTranslationError(null) } }}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <div className="r-mb-sm inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Languages className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="r-text-lg">
              {t('exportStep.languageDialogTitle', { defaultValue: 'Select Download Language' })}
            </AlertDialogTitle>
            <AlertDialogDescription className="r-text-sm">
              {t('exportStep.languageDialogDesc', { defaultValue: 'Choose the language for your export' })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid r-gap-xs">
            {(() => {
              const primary: 'en' | 'de' = language === 'de' ? 'de' : 'en'
              const secondary: 'en' | 'de' = primary === 'de' ? 'en' : 'de'
              const labelFor = (target: 'en' | 'de') => target === 'de'
                ? t('exportStep.languageDeutsch', { defaultValue: 'Deutsch' })
                : t('exportStep.languageEnglish', { defaultValue: 'English' })

              return (
                <>
                  <Button
                    variant="default"
                    disabled={!dialogFormat || translating || downloadingPdf || downloadingXlsx}
                    onClick={() => dialogFormat && performDownload(dialogFormat, primary)}
                    className="r-text-sm"
                  >
                    {labelFor(primary)}
                    {primary === 'de' ? <span className="ml-1 r-text-xs opacity-70">(AI)</span> : null}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!dialogFormat || translating || downloadingPdf || downloadingXlsx}
                    onClick={() => dialogFormat && performDownload(dialogFormat, secondary)}
                    className="r-text-sm"
                  >
                    {labelFor(secondary)}
                    {secondary === 'de' ? <span className="ml-1 r-text-xs opacity-70">(AI)</span> : null}
                  </Button>
                </>
              )
            })()}
          </div>

          {/* Translation/download status */}
          {(translating || downloadingPdf || downloadingXlsx) && (
            <div className="flex items-center r-gap-xs rounded-md border border-neutral-200 bg-neutral-50 r-px r-py-sm r-text-xs text-neutral-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>{translating ? t('exportStep.translatingForDownload', { defaultValue: 'Translating content' }) : t('exportStep.generating', { defaultValue: 'Generating' })}</span>
            </div>
          )}

          {/* Translation error */}
          {translationError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 r-px r-py-sm r-text-xs text-amber-700">
              {translationError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="r-text-sm">
              {t('exportStep.languageDialogCancel', { defaultValue: 'Cancel' })}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
