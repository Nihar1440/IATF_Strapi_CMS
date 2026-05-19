'use client'

import { useState } from 'react'
import type { D2Problem, D1Team, Metadata, D3Containment, D4RootCause, D5Actions } from '@/modules/eightd/types/report'
import { useTranslations } from 'next-intl'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  useSufficiencyCheck,
  useFieldAssist,
  useGeneration,
  useComplaintExtraction,
} from '@/modules/eightd/hooks/useAI'
import type {
  SufficiencyInput,
  AssistInput,
  GenerationInput,
  SufficiencyField,
} from '@/modules/eightd/types/ai'
import { mapGenerationToFormData } from '@/modules/eightd/lib/mapGeneration'
import { buildGenerationInput } from '@/modules/eightd/lib/buildGenerationInput'
import { applyComplaintExtraction } from '@/modules/eightd/lib/aiTransforms'
import { TemplateSection } from '@/modules/eightd/components/steps/TemplateSection'
import { FormField } from '@/modules/eightd/components/shared/FormField'
import { StepCardHeader } from '@/modules/eightd/components/shared/StepCardHeader'
import { StepNavigation } from '@/modules/eightd/components/shared/StepNavigation'
import { AIAssistField } from '@/modules/eightd/components/shared/AIAssistField'
import {
  SufficiencyAlert,
  GenerationErrorAlert,
} from '@/modules/eightd/components/shared/AIAlertFeedback'

interface Step2FormProps {
  data: D2Problem
  d1: D1Team
  metadata: Metadata
  onChange: (d: D2Problem) => void
  onGenerate: (d3: D3Containment, d4: D4RootCause, d5: D5Actions) => void
  onNext: () => void
  onBack: () => void
  language: 'en' | 'de'
}

const SUFFICIENCY_FIELD_IDS: Record<SufficiencyField, string> = {
  what: 'd2-what',
  where: 'd2-where',
  when: 'd2-when',
  howMany: 'd2-howMany',
  detectionMethod: 'd2-detection',
  whyProblem: 'd2-whyProblem',
  customerComplaintText: 'd2-complaint',
}

export function Step2Form({ data, d1, metadata, onChange, onGenerate, onNext, onBack, language }: Step2FormProps) {
  const t = useTranslations('s2')
  const tAi = useTranslations('ai')
  const tVal = useTranslations('validation')
  const [attempted, setAttempted] = useState(false)
  const {
    check: checkSufficiency,
    loading: suffLoading,
    result: suffResult,
  } = useSufficiencyCheck()
  const {
    assist,
    loading: assistLoading,
    result: assistResult,
    clear: clearAssist,
  } = useFieldAssist()
  const {
    extract,
    loading: extractLoading,
    error: extractError,
    clear: clearExtraction,
  } = useComplaintExtraction()
  const { generate, getCached, loading: genLoading, loadingPhase } = useGeneration()
  const [assistField, setAssistField] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const update = (field: keyof D2Problem, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const hasWords = (text: string, min: number) => {
    const words = text.trim().split(/\s+/).filter((w) => w.length >= 2)
    return words.length >= min
  }

  const canProceed =
    data.what.trim().length >= 10 &&
    hasWords(data.what, 3) &&
    data.where.trim().length >= 3 &&
    hasWords(data.where, 1) &&
    data.when.trim().length >= 3 &&
    hasWords(data.when, 1) &&
    data.howMany.trim() !== '' &&
    data.detectionMethod.trim().length >= 3 &&
    hasWords(data.detectionMethod, 1) &&
    data.whyProblem.trim().length >= 5 &&
    hasWords(data.whyProblem, 1)

  /** Returns error for 'what' field with its specific min-length requirement */
  const whatError = () => {
    if (!attempted) return undefined
    if (data.what.trim() === '') return tVal('required')
    if (data.what.trim().length < 10) return tVal('minChars', { min: 10 })
    if (!hasWords(data.what, 3)) return tVal('minWords', { min: 3 })
    return undefined
  }

  /** Returns error for text fields with min-length requirement */
  const fieldError = (value: string, minLen: number, minWords: number = 1) => {
    if (!attempted) return undefined
    if (value.trim() === '') return tVal('required')
    if (value.trim().length < minLen) return tVal('minChars', { min: minLen })
    if (!hasWords(value, minWords)) return tVal('minWords', { min: minWords })
    return undefined
  }

  const reqErr = (value: string) =>
    attempted && value.trim() === '' ? tVal('required') : undefined

  const handleNext = async () => {
    if (!canProceed) {
      setAttempted(true)
      return
    }

    setGenError(null)
    const genInput: GenerationInput = buildGenerationInput(metadata, d1, data)

    // 1. Check cache
    const cached = getCached(genInput, language)
    if (cached) {
      const { d3, d4, d5 } = mapGenerationToFormData(cached)
      onGenerate(d3, d4, d5)
      onNext()
      return
    }

    // 2. Sufficiency check
    const suffInput: SufficiencyInput = { d1, d2: data }
    const suffCheckResult = await checkSufficiency(suffInput, language)
    if (!suffCheckResult.success) {
      setGenError(suffCheckResult.error)
      return
    }
    if (!suffCheckResult.data.sufficient) return

    // 3. Generate
    const freshResult = await generate(genInput, language)
    if (!freshResult.success) {
      setGenError(freshResult.error)
      return
    }

    const { d3, d4, d5 } = mapGenerationToFormData(freshResult.data)
    onGenerate(d3, d4, d5)
    onNext()
  }

  const handleAssist = async (fieldName: string, fieldValue: string) => {
    if (!fieldValue.trim()) return
    setAssistField(fieldName)
    clearAssist()

    const context: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      if (k !== fieldName && v) context[k] = String(v)
    }

    const input: AssistInput = { fieldName, fieldValue, context }
    await assist(input, language)
  }

  const applyAssist = (fieldName: string) => {
    if (assistResult?.improved) {
      update(fieldName as keyof D2Problem, assistResult.improved)
      clearAssist()
      setAssistField(null)
    }
  }

  const dismissAssist = () => {
    clearAssist()
    setAssistField(null)
  }

  const handleExtractComplaint = async () => {
    if (!data.customerComplaintText.trim()) return

    clearExtraction()
    const result = await extract(
      { customerComplaintText: data.customerComplaintText },
      language,
    )

    if (result.success) {
      onChange(applyComplaintExtraction(data, result.data))
    }
  }

  const updateIsEntry = (
    dim: keyof D2Problem['isAnalysis'],
    kind: 'is' | 'isNot',
    value: string,
  ) => {
    const nextIs = {
      ...data.isAnalysis,
      [dim]: { ...data.isAnalysis[dim], [kind]: value },
    }
    const nextIsNot = {
      ...data.isNotAnalysis,
      [dim]: { ...data.isNotAnalysis[dim], [kind]: value },
    }

    if (kind === 'isNot') {
      nextIs[dim] = { ...nextIs[dim], isNot: value }
      nextIsNot[dim] = { ...nextIsNot[dim], isNot: value }
    }

    onChange({ ...data, isAnalysis: nextIs, isNotAnalysis: nextIsNot })
  }

  const complaintToolsError = extractError
  const complaintToolsLoading = extractLoading

  const handleIssueClick = (field: SufficiencyField) => {
    const fieldId = SUFFICIENCY_FIELD_IDS[field]
    const element = document.getElementById(fieldId)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (element instanceof HTMLElement) {
      element.focus()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <StepCardHeader
          title={t('title')}
          description={t('desc')}
          templateFlow={t('templateFlow')}
        />
        <CardContent className="space-y-5">
          <TemplateSection title={t('complaintSectionTitle')} description={t('complaintSectionDesc')}>
            <FormField
              type="textarea"
              id="d2-complaint"
              label={t('complaint')}
              placeholder={t('complaintPh')}
              rows={4}
              value={data.customerComplaintText}
              onChange={(v) => update('customerComplaintText', v)}
              extra={
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExtractComplaint}
                    disabled={!data.customerComplaintText.trim() || complaintToolsLoading}
                  >
                    {extractLoading ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                    )}
                    {extractLoading ? t('extractingComplaint') : t('extractComplaint')}
                  </Button>
                </div>
              }
            />
          </TemplateSection>

          <TemplateSection title={t('symptomSectionTitle')} description={t('symptomSectionDesc')}>
            <AIAssistField
              id="d2-what"
              label={t('what')}
              placeholder={t('whatPh')}
              value={data.what}
              onChange={(v) => update('what', v)}
              rows={4}
              fieldName="what"
              onAssist={handleAssist}
              assistLoading={assistLoading}
              assistResult={assistResult}
              activeAssistField={assistField}
              onApply={applyAssist}
              onDismiss={dismissAssist}
              error={whatError()}
              extra={
                <p className="text-xs text-muted-foreground">
                  {t('minChars')}{' '}
                  {data.what.length > 0 && (
                    <span
                      className={
                        data.what.length >= 10
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }
                    >
                      {t('charCount', { count: data.what.length })}
                    </span>
                  )}
                </p>
              }
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                type="textarea"
                id="d2-where"
                label={t('where')}
                placeholder={t('wherePh')}
                rows={2}
                value={data.where}
                onChange={(v) => update('where', v)}
                className="space-y-1.5"
                error={fieldError(data.where, 3)}
              />
              <FormField
                type="textarea"
                id="d2-when"
                label={t('when')}
                placeholder={t('whenPh')}
                rows={2}
                value={data.when}
                onChange={(v) => update('when', v)}
                className="space-y-1.5"
                error={fieldError(data.when, 3)}
              />
              <FormField
                type="textarea"
                id="d2-howMany"
                label={t('howMany')}
                placeholder={t('howManyPh')}
                rows={2}
                value={data.howMany}
                onChange={(v) => update('howMany', v)}
                className="space-y-1.5"
                error={reqErr(data.howMany)}
              />
              <FormField
                type="textarea"
                id="d2-detection"
                label={t('detection')}
                placeholder={t('detectionPh')}
                rows={2}
                value={data.detectionMethod}
                onChange={(v) => update('detectionMethod', v)}
                className="space-y-1.5"
                error={fieldError(data.detectionMethod, 3)}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('whyProblemSectionTitle')} description={t('whyProblemSectionDesc')}>
            <FormField
              type="textarea"
              id="d2-whyProblem"
              label={t('whyProblem')}
              placeholder={t('whyProblemPh')}
              rows={4}
              value={data.whyProblem}
              onChange={(v) => update('whyProblem', v)}
              error={fieldError(data.whyProblem, 5, 1)}
            />
          </TemplateSection>

          <TemplateSection title={t('extendedSectionTitle')} description={t('extendedSectionDesc')}>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                type="textarea"
                id="d2-qualitative"
                label={t('qualitativeDescription')}
                placeholder={t('qualitativeDescriptionPh')}
                rows={3}
                value={data.qualitativeDescription}
                onChange={(v) => update('qualitativeDescription', v)}
                extra={
                  <p className="text-xs text-muted-foreground">
                    {t('qualitativeHint')}
                  </p>
                }
              />
              <FormField
                type="textarea"
                id="d2-quantitative"
                label={t('quantitativeDeviation')}
                placeholder={t('quantitativeDeviationPh')}
                rows={3}
                value={data.quantitativeDeviation}
                onChange={(v) => update('quantitativeDeviation', v)}
                extra={
                  <p className="text-xs text-muted-foreground">
                    {t('quantitativeHint')}
                  </p>
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                type="textarea"
                id="d2-impact"
                label={t('customerImpact')}
                placeholder={t('customerImpactPh')}
                rows={3}
                value={data.customerImpact}
                onChange={(v) => update('customerImpact', v)}
              />
              <FormField
                type="textarea"
                id="d2-how"
                label={t('how')}
                placeholder={t('howPh')}
                rows={3}
                value={data.how}
                onChange={(v) => update('how', v)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                type="textarea"
                id="d2-notes"
                label={t('notes')}
                placeholder={t('notesPh')}
                rows={3}
                value={data.additionalNotes}
                onChange={(v) => update('additionalNotes', v)}
              />
            </div>
          </TemplateSection>
        </CardContent>
      </Card>

      {/* IS / IS NOT Analysis */}
      <Card>
        <StepCardHeader title={t('isIsNotTitle')} description={t('isIsNotDesc')} />
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 border-b font-medium w-[120px]">&nbsp;</th>
                  <th className="text-left py-2 px-3 border-b font-medium">{t('isConfirmed')}</th>
                  <th className="text-left py-2 px-3 border-b font-medium">{t('isNotExcluded')}</th>
                </tr>
              </thead>
              <tbody>
                {(['what', 'where', 'when', 'howMany'] as const).map((dim) => (
                  <tr key={dim}>
                    <td className="py-2 px-3 border-b font-medium text-muted-foreground">
                      {t(`isIsNot_${dim}`)}
                    </td>
                    <td className="py-2 px-3 border-b">
                      <Textarea
                        rows={2}
                        placeholder={t('isIsNotPh')}
                        value={data.isAnalysis[dim].is}
                        onChange={(e) => updateIsEntry(dim, 'is', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-3 border-b">
                      <Textarea
                        rows={2}
                        placeholder={t('isIsNotPh')}
                        value={data.isNotAnalysis[dim].isNot || data.isAnalysis[dim].isNot}
                        onChange={(e) => updateIsEntry(dim, 'isNot', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Internal Failure Code */}
      <Card>
        <StepCardHeader title={t('codeSectionTitle')} description={t('codeSectionDesc')} />
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField
              type="input"
              id="d2-failureCode"
              label={t('failureCode')}
              placeholder={t('failureCodePh')}
              value={data.internalFailureCode}
              onChange={(v) => update('internalFailureCode', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI feedback alerts */}
      <GenerationErrorAlert error={complaintToolsError} />
      <SufficiencyAlert result={suffResult} onIssueClick={handleIssueClick} />
      <GenerationErrorAlert error={genError} />

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        nextDisabled={false}
        backDisabled={suffLoading || genLoading}
        loading={suffLoading || genLoading}
        loadingLabel={
          genLoading
            ? loadingPhase === 'd3d4'
              ? t('generating_d3d4')
              : loadingPhase === 'd5'
              ? t('generating_d5')
              : t('generating')
            : tAi('sufficiency.checking')
        }
        nextLabel={t('nextBtn')}
      />
    </div>
  )
}
