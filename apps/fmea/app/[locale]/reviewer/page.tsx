'use client'

import { useEffect } from 'react'
import { Loader2, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LanguageToggle } from '@/components/language-toggle'
import { useReviewState } from '@/modules/fmea/hooks/useReviewState'
import { UploadStep } from '@/modules/fmea/components/steps/UploadStep'
import { ReviewStep } from '@/modules/fmea/components/steps/ReviewStep'
import { ExportStep } from '@/modules/fmea/components/steps/ExportStep'
import type { Language } from '@/modules/fmea/types'

function isSupportedLocale(locale: string): locale is Language {
  return locale === 'de' || locale === 'en'
}

export default function ReviewerPage() {
  const locale = useLocale()
  const t = useTranslations('fmea')
  const tApp = useTranslations('app')
  const tStep = useTranslations('fmeaStep')
  const defaultLanguage = isSupportedLocale(locale) ? locale : 'de'
  const {
    state,
    hydrated,
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    prevStep,
    setUploadedFile,
    setValidationResult,
    setLanguage,
    resetReview,
  } = useReviewState(defaultLanguage)

  useEffect(() => {
    if (!hydrated || !isSupportedLocale(locale) || state.language === locale) return
    setLanguage(locale)
  }, [hydrated, locale, setLanguage, state.language])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{tApp('restoringDraft')}</span>
          </div>
        </div>
      </main>
    )
  }

  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

  function renderStep() {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep
            state={state}
            onFileSelect={setUploadedFile}
            onValidationComplete={setValidationResult}
            onNextStep={nextStep}
          />
        )
      case 'review':
        return (
          <ReviewStep
            validationResult={state.validationResult}
            parserWarnings={state.parserWarnings}
            parserMetadata={state.parserMetadata}
            headerMap={state.headerMap}
            headerConfidence={state.headerConfidence}
            language={state.language}
          />
        )
      case 'export':
        return (
          <ExportStep
            validationResult={state.validationResult}
            rows={state.parsedRows}
            originalWorkbookBase64={state.originalWorkbookBase64}
            language={state.language}
            onReset={resetReview}
          />
        )
      default:
        return null
    }
  }

  const canGoNext = currentStep === 'upload' ? state.validationResult !== null : true
  const canGoPrev = stepIndex > 0

  return (
    <main className="min-h-screen bg-neutral-50 overflow-x-hidden">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                {tApp('brand')}
              </p>
              <h1 className="truncate text-lg font-bold text-neutral-900">
                {tStep('title')}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageToggle />
              <Badge variant="outline" className="hidden text-xs sm:inline-flex">
                {tStep(currentStep)}
              </Badge>
            </div>
          </div>
        </header>

        <div className="border-b border-neutral-100 px-4 py-3">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3">
              <Progress value={progressPct} className="h-1.5 flex-1" />
              <p className="shrink-0 text-xs text-neutral-400">
                {stepIndex + 1}/{totalSteps}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-500">
                {tApp('stepOf', { current: stepIndex + 1, total: totalSteps })}
              </p>
              <p className="text-xs text-neutral-500 sm:hidden">
                {tStep(currentStep)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {renderStep()}

        {currentStep !== 'export' && (
          <section className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={prevStep}
              disabled={!canGoPrev}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('previous', { defaultValue: 'Previous' })}
            </Button>

            <Button
              onClick={resetReview}
              variant="ghost"
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('reset', { defaultValue: 'Reset' })}
            </Button>

            <Button
              onClick={nextStep}
              disabled={!canGoNext}
              className="flex-1"
            >
              {t('next', { defaultValue: 'Next' })}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        )}
      </div>
    </main>
  )
}
