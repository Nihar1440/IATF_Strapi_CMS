'use client'

import { useMemo, useState } from 'react'
import type { ReportData, Language } from '@/modules/eightd/types/report'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useReportTranslation } from '@/modules/eightd/hooks/useAI'
import { FileText, Sheet, AlertCircle, Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { handleUnauthorized } from '@/lib/session/client'

interface ExportScreenProps {
  report: ReportData
  onReset: () => void
}

type DownloadState = 'idle' | 'generating' | 'done' | 'error'
type DownloadFormat = 'pdf' | 'xlsx'
type DownloadErrors = Record<DownloadFormat, string>
type DownloadStates = Record<DownloadFormat, DownloadState>

async function triggerDownload(
  endpoint: string,
  report: ReportData,
  language: Language,
  filename: string,
  mimeType: string,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, language }),
    credentials: 'include',
  })

  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Session expired. Redirecting…')
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportScreen({ report, onReset }: ExportScreenProps) {
  const t = useTranslations('export')
  const locale = useLocale()
  const router = useRouter()
  const {
    translateReport,
    loading: translationLoading,
    error: translationError,
    clear: clearTranslation,
  } = useReportTranslation()
  const [downloadStates, setDownloadStates] = useState<DownloadStates>({
    pdf: 'idle',
    xlsx: 'idle',
  })
  const [downloadErrors, setDownloadErrors] = useState<DownloadErrors>({
    pdf: '',
    xlsx: '',
  })
  const [dialogFormat, setDialogFormat] = useState<DownloadFormat | null>(null)

  const websiteLanguage: Language = locale === 'de' ? 'de' : 'en'
  const reportLabel = report.metadata.reportId || t('noReportId')
  const fileBase = `8D-Report-${report.metadata.reportId || 'draft'}`
  const activeFormat = dialogFormat

  const activeError = useMemo(() => {
    if (!activeFormat) return ''
    return translationError ?? downloadErrors[activeFormat]
  }, [activeFormat, downloadErrors, translationError])

  const handleDashboard = () => {
    onReset()
    router.push('/')
  }

  const setFormatState = (format: DownloadFormat, state: DownloadState) => {
    setDownloadStates((prev) => ({ ...prev, [format]: state }))
  }

  const setFormatError = (format: DownloadFormat, error: string) => {
    setDownloadErrors((prev) => ({ ...prev, [format]: error }))
  }

  const openDialog = (format: DownloadFormat) => {
    clearTranslation()
    setDialogFormat(format)
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      clearTranslation()
      setDialogFormat(null)
    }
  }

  const performDownload = async (format: DownloadFormat, targetLanguage: Language) => {
    setFormatState(format, 'generating')
    setFormatError(format, '')
    clearTranslation()

    try {
      const exportReport =
        targetLanguage === report.language
          ? report
          : await (async () => {
              const translated = await translateReport({
                report,
                targetLanguage,
              })
              if (!translated.success) {
                throw new Error(translated.error)
              }
              return translated.data
            })()

      if (format === 'pdf') {
        await triggerDownload(
          '/api/export/pdf',
          exportReport,
          targetLanguage,
          `${fileBase}.pdf`,
          'application/pdf',
        )
      } else {
        await triggerDownload(
          '/api/export/xlsx',
          exportReport,
          targetLanguage,
          `${fileBase}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
      }

      setFormatState(format, 'done')
      setDialogFormat(null)
    } catch (err) {
      setFormatError(format, err instanceof Error ? err.message : 'Unknown error')
      setFormatState(format, 'error')
    }
  }

  function btnLabel(state: DownloadState, dlKey: string): string {
    if (state === 'generating') return t('generating')
    if (state === 'done') return t('downloaded')
    return t(dlKey as Parameters<typeof t>[0])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('reportLabel')}: <strong>{reportLabel}</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base font-semibold">
                {t('pdfTitle')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('pdfDesc')}
            </p>
            {downloadErrors.pdf && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{downloadErrors.pdf}</span>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => openDialog('pdf')}
              disabled={downloadStates.pdf === 'generating' || translationLoading}
              variant={downloadStates.pdf === 'error' ? 'destructive' : 'default'}
            >
              {btnLabel(downloadStates.pdf, 'downloadPdf')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sheet className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-semibold">
                {t('xlsxTitle')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('xlsxDesc')}
            </p>
            {downloadErrors.xlsx && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{downloadErrors.xlsx}</span>
              </div>
            )}
            <Button
              className="w-full"
              variant={downloadStates.xlsx === 'error' ? 'destructive' : 'outline'}
              onClick={() => openDialog('xlsx')}
              disabled={downloadStates.xlsx === 'generating' || translationLoading}
            >
              {btnLabel(downloadStates.xlsx, 'downloadXlsx')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end">
        <Button
          onClick={handleDashboard}
          disabled={downloadStates.pdf !== 'done' && downloadStates.xlsx !== 'done'}
          variant="default"
        >
          {t('goToDashboard')}
        </Button>
      </div>

      <AlertDialog open={dialogFormat !== null} onOpenChange={handleDialogChange}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Languages className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{t('languageDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('languageDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2">
            <Button
              variant={websiteLanguage === 'en' ? 'default' : 'outline'}
              disabled={!activeFormat || translationLoading}
              onClick={() => activeFormat && performDownload(activeFormat, 'en')}
            >
              {t('languageEnglish')}
            </Button>
            <Button
              variant={websiteLanguage === 'de' ? 'default' : 'outline'}
              disabled={!activeFormat || translationLoading}
              onClick={() => activeFormat && performDownload(activeFormat, 'de')}
            >
              {t('languageGerman')}
            </Button>
          </div>

          {(translationLoading || activeError) && (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              {translationLoading ? t('translatingForDownload') : activeError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t('languageDialogCancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
