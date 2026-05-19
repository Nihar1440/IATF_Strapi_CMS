'use client'

import { useCallback } from 'react'
import { Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

import type {
  D3Containment,
  D4RootCause,
  D5Actions,
  D6Implementation,
  D7Prevention,
  D8Closure,
  SystemicMeasureItem,
} from '@/modules/eightd/types/report'
import type { GenerationD6Input, GenerationD7Input } from '@/modules/eightd/types/ai'
import { useD6Generation, useD7Generation } from '@/modules/eightd/hooks/useAI'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField } from '@/modules/eightd/components/shared/FormField'
import { StepCardHeader } from '@/modules/eightd/components/shared/StepCardHeader'
import { StepNavigation } from '@/modules/eightd/components/shared/StepNavigation'
import { TemplateSection } from '@/modules/eightd/components/steps/TemplateSection'

interface Step5FormProps {
  d3: D3Containment
  d4: D4RootCause
  d5: D5Actions
  d6: D6Implementation
  d7: D7Prevention
  d8: D8Closure
  onChangeD6: (d: D6Implementation) => void
  onChangeD7: (d: D7Prevention) => void
  onChangeD8: (d: D8Closure) => void
  onNext: () => void
  onBack: () => void
  language: 'en' | 'de'
}

/* ─── D7 document keys — data-driven instead of copy-pasted ──────────── */
const D7_DOC_KEYS = [
  'fmea',
  'controlPlan',
  'workInstructions',
  'testInspectionPlan',
  'otherDocuments',
] as const

export function Step5Form({
  d3,
  d4,
  d5,
  d6,
  d7,
  d8,
  onChangeD6,
  onChangeD7,
  onChangeD8,
  onNext,
  onBack,
  language,
}: Step5FormProps) {
  const t = useTranslations('s5')

  // ── AI generation hooks ─────────────────────────────────────────────
  const d6AI = useD6Generation()
  const d7AI = useD7Generation()
  const { generateD6 } = d6AI
  const { generateD7 } = d7AI
  const aiLoading = d6AI.loading || d7AI.loading
  const aiError = d6AI.error || d7AI.error

  /** Build a combined root cause string from D4 */
  const getRootCause = useCallback(() => {
    const parts: string[] = []
    if (d4.tua.rootCause) parts.push(`TUA: ${d4.tua.rootCause}`)
    if (d4.tun.rootCause) parts.push(`TUN: ${d4.tun.rootCause}`)
    if (d4.sua.cause) parts.push(`SUA: ${d4.sua.cause}`)
    if (d4.sun.cause) parts.push(`SUN: ${d4.sun.cause}`)
    return parts.join(' | ') || 'Unknown'
  }, [d4])

  /** Determine root cause category (technical, systemic, or both) */
  const getRootCauseCategory = useCallback((): 'technical' | 'systemic' | 'both' => {
    const hasTechnical = Boolean(d4.tua.rootCause || d4.tun.rootCause)
    const hasSystemic = Boolean(d4.sua.cause || d4.sun.cause)
    if (hasTechnical && hasSystemic) return 'both'
    if (hasSystemic) return 'systemic'
    return 'technical'
  }, [d4])

  /** Check if D5 has enough data to generate D6/D7 */
  const canGenerate = d5.actions.length > 0

  /** Generate both D6 and D7 */
  const handleGenerateD6D7 = useCallback(async () => {
    const rootCause = getRootCause()

    // Build D6 input
    const d6Input: GenerationD6Input = {
      d5Actions: d5.actions.map((a) => ({
        action: a.action,
        linkedCauseType: a.linkedCauseType,
        linkedCauseText: a.relatedRootCause,
      })),
      rootCause,
    }

    // Build D7 input
    const d7Input: GenerationD7Input = {
      d3Actions: d3.actions.map((a) => ({ action: a.action })),
      d5Actions: d5.actions.map((a) => ({
        action: a.action,
        linkedCauseType: a.linkedCauseType,
      })),
      rootCause,
      rootCauseCategory: getRootCauseCategory(),
    }

    // Run both in parallel
    const [d6Res, d7Res] = await Promise.all([
      generateD6(d6Input, language),
      generateD7(d7Input, language),
    ])

    // Apply D6 results to form
    if (d6Res.success && d6Res.data.d6.length > 0) {
      onChangeD6({
        ...d6,
        verificationResults: d6Res.data.d6
          .map((item) => `${item.action}: ${item.verification}`)
          .join('\n\n'),
        containmentRemoved: d6Res.data.d6
          .map((item) => `${item.action}: ${item.implementation}`)
          .join('\n\n'),
        implementationStatus: 'completed',
      })
    }

    // Apply D7 results to form — map AI items to the 5 document categories
    if (d7Res.success && d7Res.data.d7.length > 0) {
      const items = d7Res.data.d7
      const updated = { ...d7 }
      const keys = [...D7_DOC_KEYS]
      items.forEach((item, i) => {
        if (i < keys.length) {
          const key = keys[i]
          updated[key] = {
            ...updated[key],
            actionRequired: item.action,
            transfer: item.scope,
          }
        }
      })
      onChangeD7(updated)
    }
  }, [d3, d5, d6, d7, language, generateD6, generateD7, getRootCause, getRootCauseCategory, onChangeD6, onChangeD7])

  /** Regenerate D6 only */
  const handleRegenerateD6 = useCallback(async () => {
    const d6Input: GenerationD6Input = {
      d5Actions: d5.actions.map((a) => ({
        action: a.action,
        linkedCauseType: a.linkedCauseType,
        linkedCauseText: a.relatedRootCause,
      })),
      rootCause: getRootCause(),
    }
    const res = await generateD6(d6Input, language)
    if (res.success && res.data.d6.length > 0) {
      onChangeD6({
        ...d6,
        verificationResults: res.data.d6
          .map((item) => `${item.action}: ${item.verification}`)
          .join('\n\n'),
        containmentRemoved: res.data.d6
          .map((item) => `${item.action}: ${item.implementation}`)
          .join('\n\n'),
        implementationStatus: 'completed',
      })
    }
  }, [d5, d6, language, generateD6, getRootCause, onChangeD6])

  /** Regenerate D7 only */
  const handleRegenerateD7 = useCallback(async () => {
    const d7Input: GenerationD7Input = {
      d3Actions: d3.actions.map((a) => ({ action: a.action })),
      d5Actions: d5.actions.map((a) => ({
        action: a.action,
        linkedCauseType: a.linkedCauseType,
      })),
      rootCause: getRootCause(),
      rootCauseCategory: getRootCauseCategory(),
    }
    const res = await generateD7(d7Input, language)
    if (res.success && res.data.d7.length > 0) {
      const items = res.data.d7
      const updated = { ...d7 }
      const keys = [...D7_DOC_KEYS]
      items.forEach((item, i) => {
        if (i < keys.length) {
          const key = keys[i]
          updated[key] = {
            ...updated[key],
            actionRequired: item.action,
            transfer: item.scope,
          }
        }
      })
      onChangeD7(updated)
    }
  }, [d3, d5, d7, language, generateD7, getRootCause, getRootCauseCategory, onChangeD7])

  const updateD6 = (field: keyof D6Implementation, value: string) =>
    onChangeD6({ ...d6, [field]: value })

  const updateD7 = (
    key: keyof D7Prevention,
    updated: SystemicMeasureItem,
  ) => onChangeD7({ ...d7, [key]: updated })

  const updateD8 = (field: keyof D8Closure, value: string) =>
    onChangeD8({ ...d8, [field]: value })

  /* Mapping from D7 doc key → i18n label key */
  const d7Labels: Record<(typeof D7_DOC_KEYS)[number], string> = {
    fmea: t('docFmea'),
    controlPlan: t('docControlPlan'),
    workInstructions: t('docWorkInstructions'),
    testInspectionPlan: t('docTestInspectionPlan'),
    otherDocuments: t('docOtherDocuments'),
  }

  // All D6/D7/D8 fields are optional per schema — no required validation currently
  // The attempted pattern is in place for consistency with other steps
  const handleNext = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* AI Generation Banner */}
      {canGenerate && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900">
                {t('generateD6D7Desc')}
              </p>
            </div>
            <Button
              onClick={handleGenerateD6D7}
              disabled={aiLoading}
              className="shrink-0 gap-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {aiLoading ? t('aiGenerating') : t('generateD6D7Btn')}
            </Button>
          </CardContent>
        </Card>
      )}

      {aiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{aiError}</AlertDescription>
        </Alert>
      )}

      {/* D6 — Implementation */}
      <Card>
        <StepCardHeader
          title={t('d6Title')}
          description={t('d6Desc')}
          templateFlow={t('templateFlow')}
          actions={
            canGenerate ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateD6}
                disabled={d6AI.loading}
                className="gap-1.5 text-xs"
              >
                {d6AI.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {t('regenerateD6')}
              </Button>
            ) : undefined
          }
        />
        <CardContent className="space-y-5">
          <TemplateSection title={t('d6ExecutionTitle')} description={t('d6ExecutionDesc')}>
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                type="select"
                label={t('implStatus')}
                value={d6.implementationStatus}
                onChange={(v) => updateD6('implementationStatus', v)}
                placeholder={t('implStatusPh')}
                options={[
                  { value: 'not-started', label: t('statusNotStarted') },
                  { value: 'in-progress', label: t('statusInProgress') },
                  { value: 'completed', label: t('statusCompleted') },
                  { value: 'verified', label: t('statusVerified') },
                ]}
              />
              <FormField
                type="date"
                label={t('implDate')}
                value={d6.implementationDate}
                onChange={(v) => updateD6('implementationDate', v)}
                placeholder={t('implDate')}
              />
              <FormField
                type="input"
                label={t('responsible')}
                placeholder={t('responsiblePh')}
                value={d6.responsible}
                onChange={(v) => updateD6('responsible', v)}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('d6VerificationTitle')} description={t('d6VerificationDesc')}>
            <FormField
              type="textarea"
              label={t('verificationResults')}
              placeholder={t('verificationResultsPh')}
              rows={4}
              value={d6.verificationResults}
              onChange={(v) => updateD6('verificationResults', v)}
            />
            <FormField
              type="textarea"
              label={t('containmentRemoved')}
              placeholder={t('containmentRemovedPh')}
              rows={3}
              value={d6.containmentRemoved}
              onChange={(v) => updateD6('containmentRemoved', v)}
            />
          </TemplateSection>
        </CardContent>
      </Card>

      <Separator />

      {/* D7 — Prevention */}
      <Card>
        <StepCardHeader
          title={t('d7Title')}
          description={t('d7Desc')}
          actions={
            canGenerate ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateD7}
                disabled={d7AI.loading}
                className="gap-1.5 text-xs"
              >
                {d7AI.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {t('regenerateD7')}
              </Button>
            ) : undefined
          }
        />
        <CardContent className="space-y-4">
          <TemplateSection title={t('d7DocsTitle')} description={t('d7DocsDesc')}>
            {D7_DOC_KEYS.map((key) => {
              const item = d7[key]
              return (
                <Card key={key} className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-sm font-medium">{d7Labels[key]}</p>
                    <FormField
                      type="textarea"
                      label={t('actionUpdate')}
                      placeholder={t('actionUpdatePh')}
                      rows={2}
                      value={item.actionRequired}
                      onChange={(v) =>
                        updateD7(key, { ...item, actionRequired: v })
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        type="input"
                        label={t('transfer')}
                        placeholder={t('transferPh')}
                        value={item.transfer}
                        onChange={(v) =>
                          updateD7(key, { ...item, transfer: v })
                        }
                      />
                      <FormField
                        type="input"
                        label={t('responsible')}
                        placeholder={t('responsiblePh')}
                        value={item.responsible}
                        onChange={(v) =>
                          updateD7(key, { ...item, responsible: v })
                        }
                      />
                    </div>
                    <FormField
                      type="date"
                      label={t('dueDate')}
                      value={item.dueDate}
                      onChange={(v) => updateD7(key, { ...item, dueDate: v })}
                      placeholder={t('dueDate')}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </TemplateSection>
        </CardContent>
      </Card>

      <Separator />

      {/* D8 — Closure */}
      <Card>
        <StepCardHeader title={t('d8Title')} description={t('d8Desc')} />
        <CardContent className="space-y-5">
          <TemplateSection title={t('d8ApprovalTitle')} description={t('d8ApprovalDesc')}>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <FormField
                type="select"
                label={t('customerApproval')}
                value={d8.customerApproval}
                onChange={(v) => updateD8('customerApproval', v)}
                placeholder={t('selectPh')}
                className="space-y-1.5 xl:col-span-1"
                options={[
                  { value: 'pending', label: t('pending') },
                  { value: 'approved', label: t('approved') },
                  { value: 'rejected', label: t('rejected') },
                ]}
              />
              <FormField
                type="date"
                label={t('closureDate')}
                value={d8.closureDate}
                onChange={(v) => updateD8('closureDate', v)}
                placeholder={t('closureDate')}
                className="space-y-1.5 xl:col-span-1"
              />
              <FormField
                type="input"
                label={t('approvedBy')}
                placeholder={t('approvedByPh')}
                value={d8.approvedBy}
                onChange={(v) => updateD8('approvedBy', v)}
                className="space-y-1.5 xl:col-span-1"
              />
              <FormField
                type="select"
                label={t('customerSignOff')}
                value={d8.customerSignOff}
                onChange={(v) => updateD8('customerSignOff', v)}
                placeholder={t('selectPh')}
                className="space-y-1.5 xl:col-span-1"
                options={[
                  { value: 'pending', label: t('pending') },
                  { value: 'approved', label: t('approved') },
                  { value: 'rejected', label: t('rejected') },
                ]}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                type="date"
                label={t('signOffDate')}
                value={d8.signOffDate}
                onChange={(v) => updateD8('signOffDate', v)}
                placeholder={t('signOffDate')}
              />
            </div>
          </TemplateSection>

          <TemplateSection title={t('d8LearningTitle')} description={t('d8LearningDesc')}>
            <FormField
              type="textarea"
              label={t('lessons')}
              placeholder={t('lessonsPh')}
              rows={4}
              value={d8.lessonsLearned}
              onChange={(v) => updateD8('lessonsLearned', v)}
            />
            <FormField
              type="textarea"
              label={t('teamRecognition')}
              placeholder={t('teamRecognitionPh')}
              rows={3}
              value={d8.teamRecognition}
              onChange={(v) => updateD8('teamRecognition', v)}
            />
          </TemplateSection>
        </CardContent>
      </Card>

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        nextLabel={t('nextBtn')}
      />
    </div>
  )
}
