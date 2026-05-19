'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, Loader2, AlertCircle, FileSpreadsheet, PlayCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { FmeaReviewState } from '@/modules/fmea/hooks/useReviewState'
import type { ConfidenceLevel, FmeaValidationResult, FmeaRow, ParserResult } from '@/modules/fmea/types'
import { handleUnauthorized } from '@/lib/session/client'

interface Props {
  state: FmeaReviewState
  onFileSelect: (file: File | null) => void
  onValidationComplete: (
    result: FmeaValidationResult | null,
    rows: FmeaRow[],
    diagnostics?: {
      originalWorkbookBase64?: string
      parserWarnings?: string[]
      parserMetadata?: ParserResult['metadata'] | null
      headerMap?: Record<string, string>
      headerConfidence?: ConfidenceLevel
    }
  ) => void
  onNextStep: () => void
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function UploadStep({
  state,
  onFileSelect,
  onValidationComplete,
  onNextStep,
}: Props) {
  const t = useTranslations('fmea')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function validateFile(file: File) {
    setValidating(true)
    setValidationError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = arrayBufferToBase64(arrayBuffer)

      const response = await fetch('/api/fmea/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          file: base64,
          language: state.language,
        }),
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Validation failed')
      }

      const result = (await response.json()) as {
        validationResult?: FmeaValidationResult
        rows?: FmeaRow[]
        parserWarnings?: string[]
        parserMetadata?: ParserResult['metadata']
        headerMap?: Record<string, string>
        headerConfidence?: ConfidenceLevel
      }

      if (!result.validationResult) {
        throw new Error('Validation did not return a result')
      }

      onFileSelect(file)
      onValidationComplete(result.validationResult, result.rows ?? [], {
        parserWarnings: result.parserWarnings ?? [],
        parserMetadata: result.parserMetadata ?? null,
        headerMap: result.headerMap ?? {},
        headerConfidence: result.headerConfidence ?? 'High',
        originalWorkbookBase64: base64,
      })

      toast.success(
        t('uploadStep.validationSuccess', {
          defaultValue: 'File validated successfully',
        })
      )

      onNextStep()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setValidationError(message)
      toast.error(message)
    } finally {
      setValidating(false)
    }
  }

  function handleFileSelect(file: File) {
    if (!file.name.endsWith('.xlsx')) {
      setValidationError(
        t('uploadStep.invalidFileType', {
          defaultValue: 'Please upload an Excel file (.xlsx)',
        })
      )
      return
    }

    setValidationError(null)
    onFileSelect(file)
    onValidationComplete(null, [], {
      parserWarnings: [],
      parserMetadata: null,
      headerMap: {},
      headerConfidence: 'High',
      originalWorkbookBase64: '',
    })
  }

  function handleRemoveFile() {
    onFileSelect(null)
    onValidationComplete(null, [], {
      parserWarnings: [],
      parserMetadata: null,
      headerMap: {},
      headerConfidence: 'High',
      originalWorkbookBase64: '',
    })
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleStartReview() {
    if (!state.uploadedFile) {
      setValidationError(
        t('uploadStep.noFileSelected', {
          defaultValue: 'Please select an Excel file before starting the review.',
        })
      )
      return
    }

    validateFile(state.uploadedFile)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('uploadStep.title', { defaultValue: 'Upload FMEA File' })}
        </CardTitle>
        <CardDescription>
          {t('uploadStep.description', {
            defaultValue:
              'Upload an Excel file containing your FMEA data (.xlsx)',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {state.uploadedFileName && (
          <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
            <span className="min-w-0 flex-1 truncate font-medium">
              {state.uploadedFileName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 shrink-0 p-0 text-green-700 hover:bg-green-100 hover:text-green-900"
              onClick={handleRemoveFile}
              disabled={validating}
              aria-label={t('uploadStep.removeFile', { defaultValue: 'Remove file' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!state.uploadedFileName && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            } ${validating ? 'opacity-50' : ''}`}
          >
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {t('uploadStep.dragText', {
                    defaultValue: 'Drag and drop your FMEA file here',
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('uploadStep.orText', {
                    defaultValue: 'or click to browse',
                  })}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleInputChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={validating}
            />
          </div>
        )}

        {!state.uploadedFileName && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={validating}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('uploadStep.selectFile', {
              defaultValue: 'Select File',
            })}
          </Button>
        )}

        {state.uploadedFileName && (
          <Button
            onClick={handleStartReview}
            disabled={validating}
            className="w-full"
            size="lg"
          >
            {validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('uploadStep.validating', {
                  defaultValue: 'Validating file...',
                })}
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                {t('uploadStep.startReview', {
                  defaultValue: 'Start Review',
                })}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
