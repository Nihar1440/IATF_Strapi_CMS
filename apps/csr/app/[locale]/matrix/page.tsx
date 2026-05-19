'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { LanguageToggle } from '@/components/language-toggle'
import { useTranslations, useLocale } from 'next-intl'

import { useCsrFormState } from '@/modules/csr/hooks/useCsrFormState'
import { OemSelectionStep } from '@/modules/csr/components/steps/OemSelectionStep'
import { ProcessMapStep } from '@/modules/csr/components/steps/ProcessMapStep'
import { MatrixPreviewStep } from '@/modules/csr/components/steps/MatrixPreviewStep'
import { ExportStep } from '@/modules/csr/components/steps/ExportStep'
import type { Language, MatrixRow, ConflictInfo } from '@/modules/csr/types'

function isSupportedLocale(locale: string): locale is Language {
  return locale === 'de' || locale === 'en'
}

export default function CsrMatrixPage() {
  const locale = useLocale()
  const t = useTranslations('csrStep')
  const tApp = useTranslations('app')

  const defaultLanguage: Language = isSupportedLocale(locale) ? locale : 'en'

  const {
    form,
    conflicts,
    insights,
    aiPowered,
    hydrated,
    stepIndex,
    totalSteps,
    currentStep,
    nextStep,
    prevStep,
    setSelectedOems,
    setProcesses,
    setCompanyName,
    setCompanyLocation,
    setLanguage,
    setMatrixData,
    setProcessMapImage,
    updateImplementationRecord,
    setCompanyLogo,
    resetForm,
  } = useCsrFormState(defaultLanguage)

  const handleMatrixGenerated = (rows: MatrixRow[], newConflicts: ConflictInfo[], aiInsights: string[], isAiPowered: boolean) => {
    setMatrixData(rows, newConflicts, aiInsights, isAiPowered)
  }

  // Sync locale → form language
  useEffect(() => {
    if (!hydrated || !isSupportedLocale(locale) || form.language === locale) return
    setLanguage(locale)
  }, [hydrated, locale, form.language, setLanguage])

  // Scroll to top on step change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

  function renderStep() {
    switch (currentStep) {
      case 'oem-selection':
        return (
          <OemSelectionStep
            selectedOems={form.selectedOems}
            language={form.language}
            onChangeOems={setSelectedOems}
            onChangeLanguage={setLanguage}
            companyName={form.companyName}
            companyLocation={form.companyLocation}
            onChangeCompanyName={setCompanyName}
            onChangeCompanyLocation={setCompanyLocation}
            companyLogo={form.companyLogo}
            onChangeLogo={setCompanyLogo}
            onNext={nextStep}
          />
        )
      case 'process-map':
        return (
          <ProcessMapStep
            processes={form.processes}
            language={form.language}
            processMapImage={form.processMapImage}
            onChange={setProcesses}
            onImageChange={setProcessMapImage}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 'matrix-preview':
        return (
          <MatrixPreviewStep
            selectedOems={form.selectedOems}
            processes={form.processes}
            matrixRows={form.matrixRows}
            conflicts={conflicts}
            insights={insights}
            aiPowered={aiPowered}
            implementationRecords={form.implementationRecords}
            onImplementationChange={updateImplementationRecord}
            onMatrixGenerated={handleMatrixGenerated}
            onNext={nextStep}
            onBack={prevStep}
            language={form.language}
          />
        )
      case 'export':
        return <ExportStep form={form} conflicts={conflicts} onReset={resetForm} />
      default:
        return null
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center r-px">
          <div className="flex items-center r-gap-sm rounded-lg border border-neutral-200 bg-white r-px r-py-sm r-text-sm text-neutral-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{tApp('restoringDraft')}</span>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 overflow-x-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between r-gap-sm r-px r-py-sm">
            <div className="min-w-0 flex-1">
              <p className="r-text-xs font-medium uppercase tracking-widest text-neutral-400">
                {tApp('brand')}
              </p>
              <h1 className="truncate r-text-lg font-bold text-neutral-900">
                {t('title')}
              </h1>
            </div>
            <div className="flex shrink-0 items-center r-gap-xs">
              <LanguageToggle />
              <Badge variant="outline" className="hidden r-text-xs sm:inline-flex">
                {t(currentStep)}
              </Badge>
            </div>
          </div>
        </header>

        <div className="border-b border-neutral-100 r-px r-py-sm">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center r-gap-sm">
              <Progress value={progressPct} className="h-1.5 flex-1" />
              <p className="shrink-0 r-text-xs text-neutral-400">
                {stepIndex + 1}/{totalSteps}
              </p>
            </div>
            <p className="r-mt-sm r-text-xs text-neutral-500 sm:hidden">
              {t(currentStep)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl r-space-y-section r-px r-py-lg overflow-hidden">
        {renderStep()}
      </div>
    </main>
  )
}
