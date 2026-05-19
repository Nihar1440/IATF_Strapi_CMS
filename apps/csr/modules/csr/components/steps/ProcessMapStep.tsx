'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { handleUnauthorized } from '@/lib/session/client'
import type { ProcessEntry, Language } from '../../types'
import { ALL_DEFAULT_PROCESSES, DEFAULT_PROCESSES_DE } from '../../data'
import { MAX_PROCESSES } from '../../lib/constants'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

interface Props {
  processes: ProcessEntry[]
  language: Language
  processMapImage?: string
  onChange: (processes: ProcessEntry[]) => void
  onImageChange: (image: string | undefined) => void
  onNext: () => void
  onBack: () => void
}

let nextId = 100

export function ProcessMapStep({ processes, language, processMapImage, onChange, onImageChange, onNext, onBack }: Props) {
  const t = useTranslations('csr')
  const [showDefaults, setShowDefaults] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addProcess() {
    if (processes.length >= MAX_PROCESSES) return
    const id = `P-USR-${String(++nextId).padStart(3, '0')}`
    onChange([...processes, { id, name: '', owner: '' }])
  }

  function removeProcess(id: string) {
    onChange(processes.filter((p) => p.id !== id))
  }

  function updateProcess(id: string, field: keyof ProcessEntry, value: string) {
    onChange(
      processes.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    )
  }

  function loadDefaults() {
    const mapped = ALL_DEFAULT_PROCESSES.map((p) => ({
      ...p,
      name: language === 'de' ? (DEFAULT_PROCESSES_DE[p.id] ?? p.name) : p.name,
    }))
    onChange(mapped)
    setShowDefaults(false)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null)
    setAnalysisSummary(null)
    setAnalysisError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(t('imageTypeError'))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(t('imageSizeError'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      onImageChange(result)
    }
    reader.onerror = () => {
      setImageError(t('imageReadError'))
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage() {
    onImageChange(undefined)
    setImageError(null)
    setAnalysisSummary(null)
    setAnalysisError(null)
  }

  async function analyzeImage() {
    if (!processMapImage) return
    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisSummary(null)

    try {
      // Extract base64 data and MIME type from data URL
      const match = processMapImage.match(/^data:(image\/[^;]+);base64,(.+)$/)
      if (!match) {
        setAnalysisError(t('imageReadError'))
        return
      }
      const [, mimeType, base64Data] = match

      const res = await fetch('/api/csr/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'analyze-process-image',
          imageData: base64Data,
          imageMimeType: mimeType,
          language,
        }),
      })

      if (res.status === 401) {
        handleUnauthorized()
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || 'AI analysis failed')
      }

      const data = await res.json()
      const extracted: { id: string; name: string; owner: string }[] = data.processes ?? []

      if (extracted.length === 0) {
        setAnalysisError(t('noProcessesExtracted'))
        return
      }

      // Replace current process list with AI-extracted processes
      onChange(extracted.map((p) => ({ id: p.id, name: p.name, owner: p.owner || '' })))
      setAnalysisSummary(
        t('processesExtracted', { count: extracted.length }) +
          (data.summary ? ` — ${data.summary}` : ''),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI analysis failed'
      setAnalysisError(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  const canProceed = processes.length > 0 && processes.every((p) => p.name.trim().length > 0)

  return (
    <div className="r-space-y-section">
      {/* Process Map Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center r-gap-xs r-text-lg">
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('processMapImage')}
          </CardTitle>
          <CardDescription className="r-text-sm">{t('processMapImageDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {processMapImage ? (
            <div className="r-space-y-sm">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processMapImage}
                  alt="Process map"
                  className="max-h-48 sm:max-h-64 rounded-lg border border-neutral-200 object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center r-gap-xs">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className="r-text-xs"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      {t('analyzingImage')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3 w-3" />
                      {t('analyzeWithAI')}
                    </>
                  )}
                </Button>
              </div>
              {analysisSummary && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="r-text-sm">{analysisSummary}</AlertDescription>
                </Alert>
              )}
              {analysisError && (
                <p className="r-text-sm text-red-500">{analysisError}</p>
              )}
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 r-p-lg transition-colors hover:border-blue-400 hover:bg-blue-50/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="r-mb-sm h-6 w-6 sm:h-8 sm:w-8 text-neutral-400" />
              <p className="r-text-sm font-medium text-neutral-600">{t('uploadProcessMap')}</p>
              <p className="r-mt-sm r-text-xs text-neutral-400">{t('uploadFormats')}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleImageUpload}
          />
          {imageError && (
            <p className="r-mt-sm r-text-sm text-red-500">{imageError}</p>
          )}
        </CardContent>
      </Card>

      {/* Process List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between r-gap-sm">
            <div>
              <CardTitle className="r-text-lg">{t('step2Title')}</CardTitle>
              <CardDescription className="r-text-sm">
                {processMapImage ? t('step2DescWithImage') : t('step2Desc')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDefaults(!showDefaults)}
              className="r-text-xs self-start"
            >
              {showDefaults ? <ChevronUp className="mr-1.5 h-3 w-3" /> : <ChevronDown className="mr-1.5 h-3 w-3" />}
              {t('templateProcesses')}
            </Button>
          </div>
        </CardHeader>

        {showDefaults && (
          <CardContent className="border-b border-neutral-100 bg-blue-50/50 r-p-sm">
            <p className="r-mb-sm r-text-sm text-neutral-600">{t('templateProcessesDesc')}</p>
            <Button variant="secondary" size="sm" onClick={loadDefaults} className="r-text-xs">
              {t('loadDefaultProcesses')}
            </Button>
          </CardContent>
        )}

        <CardContent className="pt-4">
          {/* Column headers — visible on sm+ screens */}
          {processes.length > 0 && (
            <div className="hidden sm:flex items-end r-gap-xs r-mb-sm">
              <span className="w-6 shrink-0" />
              <Label className="flex-1 r-text-xs font-semibold text-neutral-600">{t('processName')}</Label>
              <Label className="w-40 r-text-xs font-semibold text-neutral-600">{t('processOwner')}</Label>
              <span className="w-9 shrink-0" /> {/* spacer for delete button */}
            </div>
          )}

          <div className="r-space-y-sm">
            {processes.map((process, idx) => (
              <div key={process.id} className="flex flex-col sm:flex-row sm:items-center r-gap-xs">
                {/* Row number — desktop only */}
                <span className="hidden sm:block w-6 shrink-0 text-center r-text-xs text-neutral-400">
                  {idx + 1}
                </span>

                {/* Process name */}
                <div className="flex-1">
                  {/* Label — mobile only (desktop has column header) */}
                  <Label className="sm:hidden r-text-xs text-neutral-500 r-mb-sm block">{t('processName')}</Label>
                  <Input
                    value={process.name}
                    onChange={(e) => updateProcess(process.id, 'name', e.target.value)}
                    placeholder={t('processNamePh')}
                    className="r-text-sm"
                  />
                </div>

                {/* Process owner */}
                <div className="w-full sm:w-40">
                  {/* Label — mobile only (desktop has column header) */}
                  <Label className="sm:hidden r-text-xs text-neutral-500 r-mb-sm block">{t('processOwner')}</Label>
                  <Input
                    value={process.owner ?? ''}
                    onChange={(e) => updateProcess(process.id, 'owner', e.target.value)}
                    placeholder={t('processOwnerPh')}
                    className="r-text-sm"
                  />
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-neutral-400 hover:text-red-500 self-end sm:self-center"
                  onClick={() => removeProcess(process.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addProcess}
            disabled={processes.length >= MAX_PROCESSES}
            className="r-mt-sm r-text-xs"
          >
            <Plus className="mr-1.5 h-3 w-3" />
            {t('addProcess')}
          </Button>
        </CardContent>
      </Card>

      {!canProceed && processes.length > 0 && (
        <p className="text-center r-text-sm text-red-500">{t('allProcessesNeedName')}</p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between r-gap-sm">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto r-text-sm">
          {t('backOemSelection')}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="w-full sm:w-auto r-text-sm">
          {t('nextGenerateMatrix')}
        </Button>
      </div>
    </div>
  )
}
