'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  D4RootCause,
  D5Actions,
  D3Containment,
  D2Problem,
  D1Team,
  Metadata,
  FiveWhyChain,
  CorrectiveAction,
} from '@/modules/eightd/types/report'
import { EMPTY_FIVE_WHY, EMPTY_SYSTEMIC_CAUSE } from '@/modules/eightd/types/report'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkles, RotateCcw, Loader2 } from 'lucide-react'
import {
  useGeneration,
  useConsistencyCheck,
  useChainCompletion,
  useD5Generation,
  useRootCauseBackfill,
} from '@/modules/eightd/hooks/useAI'
import type {
  ConsistencyInput,
  ChainCompletionInput,
  RootCauseBackfillInput,
} from '@/modules/eightd/types/ai'
import { mapGenerationToFormData, mapGenerationD5ToFormData } from '@/modules/eightd/lib/mapGeneration'
import { buildGenerationInput } from '@/modules/eightd/lib/buildGenerationInput'
import { normalizeFiveWhyChain, normalizeWhyAnswer } from '@/modules/eightd/lib/aiTransforms'
import { cn } from '@/lib/utils'
import { TemplateSection } from '@/modules/eightd/components/steps/TemplateSection'
import { FormField } from '@/modules/eightd/components/shared/FormField'
import { StepCardHeader } from '@/modules/eightd/components/shared/StepCardHeader'
import { StepNavigation } from '@/modules/eightd/components/shared/StepNavigation'
import { SystemicCauseCard } from '@/modules/eightd/components/shared/SystemicCauseCard'
import {
  ActionListManager,
  ActionItemHeader,
} from '@/modules/eightd/components/shared/ActionListManager'
import {
  AIErrorAlert,
  ConsistencyAlert,
} from '@/modules/eightd/components/shared/AIAlertFeedback'

/* ──────────────────────────────── Props ──────────────────────────────── */

interface Step4FormProps {
  d4: D4RootCause
  d5: D5Actions
  d3: D3Containment
  d2: D2Problem
  d1: D1Team
  metadata: Metadata
  onChangeD4: (d: D4RootCause) => void
  onChangeD5: (d: D5Actions) => void
  onNext: () => void
  onBack: () => void
  language: 'en' | 'de'
}

/* ──────────────────────────── FiveWhyCard ─────────────────────────────── */

function FiveWhyCard({
  label,
  description,
  chain,
  onChangeChain,
  rootCauseError,
  whyError,
  onRegenerateFrom,
  regenLoading,
  onGenerateFromRootCause,
  rootCauseBackfillLoading,
}: {
  label: string
  description: string
  chain: FiveWhyChain
  onChangeChain: (c: FiveWhyChain) => void
  rootCauseError?: string
  /** Returns error string for a given why field (1-5) */
  whyError?: (n: number, value: string) => string | undefined
  /** Called when user clicks 'Regenerate from Why N' — AI will grammar-fix the edited text and regenerate subsequent Whys */
  onRegenerateFrom?: (whyNumber: number) => void
  /** Whether a partial regeneration is currently in progress */
  regenLoading?: boolean
  onGenerateFromRootCause?: () => void
  rootCauseBackfillLoading?: boolean
}) {
  const t = useTranslations('s4')

  const update = (field: keyof FiveWhyChain, value: string) =>
    onChangeChain({ ...chain, [field]: value })

  return (
    <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] xl:items-start">
          <div className="space-y-1.5">
            <Label>{t('possibleCause')}</Label>
            <Textarea
              placeholder={t('possibleCausePh')}
              rows={2}
              value={chain.possibleCause}
              onChange={(e) => update('possibleCause', e.target.value)}
            />
          </div>

          <div className="self-start space-y-4 rounded-lg border bg-background p-4">
            <FormField
              type="input"
              label={t('causeDomain')}
              placeholder={t('causeDomainPh')}
              value={chain.causeDomain}
              onChange={(v) => update('causeDomain', v)}
            />
            <FormField
              type="input"
              label={t('rootCauseCode')}
              placeholder={t('rootCauseCodePh')}
              value={chain.rootCauseCode}
              onChange={(v) => update('rootCauseCode', v)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const val = chain[`why${n}` as keyof FiveWhyChain] as string
            const err = whyError?.(n, val)
            return (
              <div key={n} className="space-y-1">
                <div className="grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('why', { n })}
                  </Label>
                  <div className="space-y-2">
                    <Textarea
                      value={val}
                      onChange={(e) =>
                        update(`why${n}` as keyof FiveWhyChain, e.target.value)
                      }
                      rows={4}
                      className={cn('min-h-32', err && 'border-red-500 focus-visible:ring-red-500')}
                    />
                    {onRegenerateFrom && val.trim() && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onRegenerateFrom(n)}
                          disabled={regenLoading}
                        >
                          {regenLoading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-1 h-3 w-3" />
                          )}
                          {t('regenerate')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {err && <p className="text-xs text-red-500 pl-1">{err}</p>}
              </div>
            )
          })}

          <div className="space-y-1.5">
            <Label>{t('rootCause')}</Label>
            <Textarea
              placeholder={t('rootCausePh')}
              rows={3}
              value={chain.rootCause}
              onChange={(e) => update('rootCause', e.target.value)}
              className={cn(rootCauseError && 'border-red-500 focus-visible:ring-red-500')}
            />
            {rootCauseError && (
              <p className="text-xs text-red-500">{rootCauseError}</p>
            )}
            {onGenerateFromRootCause && chain.rootCause.trim() && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onGenerateFromRootCause}
                  disabled={rootCauseBackfillLoading}
                >
                  {rootCauseBackfillLoading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  {t('generateFromRootCause')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────── emptyAction ─────────────────────────────── */

function emptyCorrectiveAction(): CorrectiveAction {
  return {
    id: crypto.randomUUID(),
    action: '',
    relatedRootCause: '',
    linkedCauseType: 'TUA',
    linkedCauseCode: '',
    actionCategory: '',
    responsible: '',
    targetDate: '',
    verificationMethod: '',
    notes: '',
  }
}

/* ──────────────────────────── Step4Form ───────────────────────────────── */

export function Step4Form({
  d4,
  d5,
  d3,
  d2,
  d1,
  metadata,
  onChangeD4,
  onChangeD5,
  onNext,
  onBack,
  language,
}: Step4FormProps) {
  const t = useTranslations('s4')
  const tAi = useTranslations('ai')
  const tVal = useTranslations('validation')
  const [attempted, setAttempted] = useState(false)

  // AI hooks
  const {
    generate,
    loading: genLoading,
    error: genError,
    result: genResult,
    regenCount,
    canRegenerate,
    clearGeneration,
  } = useGeneration()

  const {
    debouncedCheck: debouncedConsistencyCheck,
    loading: consistencyLoading,
    result: consistencyResult,
    clear: clearConsistency,
  } = useConsistencyCheck()

  const {
    generateD5,
    loading: d5RegenLoading,
    error: d5RegenError,
    clear: clearD5Regen,
  } = useD5Generation()

  const hasGeneratedContent =
    genResult !== null ||
    d4.tua.rootCause.trim().length > 0 ||
    d4.tun.rootCause.trim().length > 0

  /* ── AI generation ── */
  const handleGenerate = useCallback(
    async (forceRegenerate = false) => {
      const input = buildGenerationInput(metadata, d1, d2)
      const result = await generate(input, language, forceRegenerate)

      if (result.success) {
        const { d4: mappedD4, d5: mappedD5 } = mapGenerationToFormData(result.data, {
          complaintDate: metadata.complaintDate,
        })
        onChangeD4(mappedD4)
        onChangeD5(mappedD5)
      }
    },
    [metadata, d1, d2, language, generate, onChangeD4, onChangeD5],
  )

  const handleRegenerate = () => {
    clearGeneration()
    clearConsistency()
    clearD5Regen()
    handleGenerate(true)
  }

  /* ── Consistency check on D4/D5 edits ── */
  const triggerConsistencyCheck = useCallback(() => {
    if (!hasGeneratedContent) return

    const input: ConsistencyInput = {
      d2: {
        what: d2.what,
        where: d2.where,
        when: d2.when,
        howMany: d2.howMany,
        detectionMethod: d2.detectionMethod,
      },
      d3: {
        actions: d3.actions.map((a) => ({
          action: a.action,
          responsible: a.responsible,
        })),
      },
      d4: { tua: d4.tua, tun: d4.tun, sua: d4.sua, sun: d4.sun },
      d5: {
        actions: d5.actions.map((a) => ({
          action: a.action,
          linkedCauseType: a.linkedCauseType,
          linkedCauseText: a.relatedRootCause,
          responsible: a.responsible,
          verificationMethod: a.verificationMethod,
        })),
      },
    }

    debouncedConsistencyCheck(input, language)
  }, [d2, d3.actions, d4, d5, hasGeneratedContent, language, debouncedConsistencyCheck])

  useEffect(() => {
    if (hasGeneratedContent && genResult) {
      triggerConsistencyCheck()
    }
  }, [d4, d5, genResult, hasGeneratedContent, triggerConsistencyCheck])

  /* ── D4 change handler ── */
  const handleD4Change = useCallback((newD4: D4RootCause) => onChangeD4(newD4), [onChangeD4])

  /** Validate that a date is not in the past */
  const futureDateErr = (value: string) => {
    if (!value) return tVal('required')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(value)
    if (d < today) return tVal('futureDate')
    return undefined
  }

  const canProceed =
    d4.tua.rootCause.trim().length >= 3 &&
    d4.tun.rootCause.trim().length >= 3 &&
    d4.tua.why1.trim() !== '' &&
    d4.tua.why2.trim() !== '' &&
    d4.tua.why3.trim() !== '' &&
    d4.tun.why1.trim() !== '' &&
    d4.tun.why2.trim() !== '' &&
    d4.tun.why3.trim() !== '' &&
    d5.actions.length > 0 &&
    d5.actions.every((a) => a.action.trim() !== '' && futureDateErr(a.targetDate) === undefined)

  const handleNext = () => {
    if (!canProceed) {
      setAttempted(true)
      return
    }
    onNext()
  }

  const rootCauseErr = (value: string) => {
    if (!attempted) return undefined
    if (value.trim() === '') return tVal('required')
    if (value.trim().length < 3) return tVal('minChars', { min: 3 })
    return undefined
  }

  /** Validate why1-3 (required), why4-5 (optional) */
  const whyErr = (n: number, value: string) => {
    if (!attempted) return undefined
    if (n <= 3 && value.trim() === '') return tVal('required')
    return undefined
  }

  const actionErr = (value: string) => {
    if (!attempted) return undefined
    if (value.trim() === '') return tVal('required')
    return undefined
  }


  /* ── Per-Why partial regeneration (FB4) ── */
  const {
    complete: completeChain,
    loading: chainLoading,
  } = useChainCompletion()
  const {
    backfill,
    loading: backfillLoading,
    error: backfillError,
    clear: clearBackfill,
  } = useRootCauseBackfill()

  const regenerateD5FromD4 = useCallback(
    async (nextD4: D4RootCause) => {
      const d5Input = {
        d2: {
          what: d2.what,
          where: d2.where,
          when: d2.when,
          howMany: d2.howMany,
          detectionMethod: d2.detectionMethod,
          customerComplaintText: d2.customerComplaintText,
          additionalNotes: d2.additionalNotes,
        },
        d4: {
          tua: nextD4.tua,
          tun: nextD4.tun,
          sua: nextD4.sua,
          sun: nextD4.sun,
        },
      }

      const d5Result = await generateD5(d5Input, language)
      if (!d5Result.success) return

      const mappedD5 = mapGenerationD5ToFormData(d5Result.data)
      onChangeD5({
        ...mappedD5,
        // Keep manually written verification plan text stable.
        plannedVerification: d5.plannedVerification,
      })
    },
    [d2, d5.plannedVerification, generateD5, language, onChangeD5],
  )

  /**
   * When user edits a Why field and clicks "Regenerate from here":
   * 1. Grammar-correct the edited Why text via AI chain completion
   * 2. Auto-generate subsequent Why fields (and root cause) sequentially
   */
  const handleRegenerateFromWhy = useCallback(
    async (chainType: 'tua' | 'tun', whyNumber: number) => {
      const chain = d4[chainType]
      const whyKey = `why${whyNumber}` as keyof FiveWhyChain
      const currentValue = chain[whyKey] as string

      if (!currentValue.trim()) return

      // 1. Prepare previous history for context
      const previousWhys: string[] = []
      for (let i = 1; i < whyNumber; i++) {
        const k = `why${i}` as keyof FiveWhyChain
        if (chain[k]) previousWhys.push(normalizeWhyAnswer(chain[k] as string))
      }

      const input: ChainCompletionInput = {
        chainType,
        whyNumber,
        currentWhy: normalizeWhyAnswer(currentValue),
        context: {
          d2: {
            what: d2.what,
            where: d2.where,
            when: d2.when,
          },
          previousWhys,
        },
      }

      const result = await completeChain(input, language)

      // 2. Build updated chain with grammar-corrected text and generated subsequent Whys.
      // Preserve existing values if AI returns fewer new items than expected.
      const updatedChain = { ...chain }
      if (result.success && result.data) {
        if (result.data.improvedCurrentWhy.trim()) {
          updatedChain[whyKey] = normalizeWhyAnswer(result.data.improvedCurrentWhy) as never
        }
        let answerIndex = 0
        for (let i = whyNumber + 1; i <= 5; i++) {
          const k = `why${i}` as keyof FiveWhyChain
          const generatedWhy = normalizeWhyAnswer(
            result.data.subsequentWhys[answerIndex]?.trim() ?? '',
          )
          if (generatedWhy) {
            updatedChain[k] = generatedWhy as never
          }
          answerIndex++
        }
        if (result.data.rootCause.trim()) {
          updatedChain.rootCause = result.data.rootCause
        }
      }

      const normalizedChain = normalizeFiveWhyChain(updatedChain)

      const nextD4: D4RootCause = {
        ...d4,
        [chainType]: normalizedChain,
      }

      // Keep systemic traceability aligned with technical-chain root causes.
      if (chainType === 'tua' && normalizedChain.rootCause.trim()) {
        const shouldRefreshSuaCause =
          !nextD4.sua.cause.trim() || nextD4.sua.derivedFrom.trim() === chain.rootCause.trim()
        nextD4.sua = {
          ...nextD4.sua,
          cause: shouldRefreshSuaCause
            ? language === 'de'
              ? `Systemabsicherung fuer "${normalizedChain.rootCause}" fehlt.`
              : `System controls are missing to prevent "${normalizedChain.rootCause}".`
            : nextD4.sua.cause,
          derivedFrom: normalizedChain.rootCause,
        }
      }
      if (chainType === 'tun' && normalizedChain.rootCause.trim()) {
        const shouldRefreshSunCause =
          !nextD4.sun.cause.trim() || nextD4.sun.derivedFrom.trim() === chain.rootCause.trim()
        nextD4.sun = {
          ...nextD4.sun,
          cause: shouldRefreshSunCause
            ? language === 'de'
              ? `Systemabsicherung fuer "${normalizedChain.rootCause}" in der Fehlererkennung fehlt.`
              : `System controls are missing to detect "${normalizedChain.rootCause}".`
            : nextD4.sun.cause,
          derivedFrom: normalizedChain.rootCause,
        }
      }

      handleD4Change(nextD4)
      await regenerateD5FromD4(nextD4)
    },
    [d4, d2, language, completeChain, handleD4Change, regenerateD5FromD4],
  )

  const handleGenerateFromRootCause = useCallback(
    async (chainType: 'tua' | 'tun') => {
      const chain = d4[chainType]
      if (!chain.rootCause.trim()) return

      clearBackfill()

      const input: RootCauseBackfillInput = {
        chainType,
        rootCause: chain.rootCause.trim(),
        context: {
          d2: {
            what: d2.what,
            where: d2.where,
            when: d2.when,
            howMany: d2.howMany,
            detectionMethod: d2.detectionMethod,
          },
        },
      }

      const result = await backfill(input, language)
      if (!result.success) return

      const normalizedChain = normalizeFiveWhyChain({
        ...chain,
        possibleCause: result.data.possibleCause.trim() || chain.possibleCause,
        why1: result.data.why1,
        why2: result.data.why2,
        why3: result.data.why3,
        why4: result.data.why4,
        why5: result.data.why5,
        rootCause: result.data.rootCause.trim() || chain.rootCause,
      })

      const nextD4: D4RootCause = {
        ...d4,
        [chainType]: normalizedChain,
      }

      if (chainType === 'tua' && normalizedChain.rootCause.trim()) {
        nextD4.sua = {
          ...nextD4.sua,
          derivedFrom: normalizedChain.rootCause,
        }
      }

      if (chainType === 'tun' && normalizedChain.rootCause.trim()) {
        nextD4.sun = {
          ...nextD4.sun,
          derivedFrom: normalizedChain.rootCause,
        }
      }

      handleD4Change(nextD4)
      await regenerateD5FromD4(nextD4)
    },
    [backfill, clearBackfill, d2, d4, handleD4Change, language, regenerateD5FromD4],
  )

  return (
    <div className="space-y-6">
      {/* AI generation card */}
      {!hasGeneratedContent && (
        <Card>
          <StepCardHeader title={t('aiTitle')} description={t('aiDesc')} />
          <CardContent>
            <Button onClick={() => handleGenerate(false)} disabled={genLoading}>
              {genLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {genLoading ? t('generating') : t('generateBtn')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI generation error */}
      <AIErrorAlert
        error={genError}
        onRetry={() => handleGenerate(true)}
        onManual={() =>
          onChangeD4({
            tua: { ...EMPTY_FIVE_WHY },
            tun: { ...EMPTY_FIVE_WHY },
            sua: { ...EMPTY_SYSTEMIC_CAUSE },
            sun: { ...EMPTY_SYSTEMIC_CAUSE },
          })
        }
        retryDisabled={genLoading}
      />
      <AIErrorAlert error={d5RegenError} />
      <AIErrorAlert error={backfillError} />

      {/* D4 — Root Cause 5-Why */}
      <Card>
        <StepCardHeader
          title={t('d4Title')}
          description={t('d4Desc')}
          templateFlow={t('templateFlow')}
          actions={
            genResult ? (
              <>
                <Badge variant="secondary" className="text-xs">
                  {t('aiBadge')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleRegenerate}
                  disabled={genLoading || d5RegenLoading || !canRegenerate}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {t('regenerate')}
                </Button>
              </>
            ) : undefined
          }
          extra={
            genResult ? (
              <p className="text-xs text-muted-foreground">
                {tAi('gen.regenCount', { count: regenCount, max: 5 })}
              </p>
            ) : undefined
          }
        />
        <CardContent className="space-y-6">
          <TemplateSection
            title={t('occurrence')}
            description={t('occurrenceDesc')}
            className="border-none bg-transparent p-0"
            contentClassName="space-y-4"
          >
            <FiveWhyCard
              label={t('tua')}
              description={t('tuaDesc')}
              chain={d4.tua}
              onChangeChain={(c) => handleD4Change({ ...d4, tua: c })}
              rootCauseError={rootCauseErr(d4.tua.rootCause)}
              whyError={whyErr}
              onRegenerateFrom={(n) => handleRegenerateFromWhy('tua', n)}
              regenLoading={chainLoading || d5RegenLoading}
              onGenerateFromRootCause={() => handleGenerateFromRootCause('tua')}
              rootCauseBackfillLoading={backfillLoading || d5RegenLoading}
            />
          </TemplateSection>

          <Separator />

          <TemplateSection
            title={t('detection')}
            description={t('detectionDesc')}
            className="border-none bg-transparent p-0"
            contentClassName="space-y-4"
          >
            <FiveWhyCard
              label={t('tun')}
              description={t('tunDesc')}
              chain={d4.tun}
              onChangeChain={(c) => handleD4Change({ ...d4, tun: c })}
              rootCauseError={rootCauseErr(d4.tun.rootCause)}
              whyError={whyErr}
              onRegenerateFrom={(n) => handleRegenerateFromWhy('tun', n)}
              regenLoading={chainLoading || d5RegenLoading}
              onGenerateFromRootCause={() => handleGenerateFromRootCause('tun')}
              rootCauseBackfillLoading={backfillLoading || d5RegenLoading}
            />
          </TemplateSection>

          <Separator />

          <TemplateSection title={t('systemicSectionTitle')} description={t('systemicSectionDesc')}>
            <div className="grid gap-4 xl:grid-cols-2">
              <SystemicCauseCard
                label={t('sua')}
                description={t('suaDesc')}
                value={d4.sua}
                onChange={(v) => handleD4Change({ ...d4, sua: v })}
              />
              <SystemicCauseCard
                label={t('sun')}
                description={t('sunDesc')}
                value={d4.sun}
                onChange={(v) => handleD4Change({ ...d4, sun: v })}
              />
            </div>
          </TemplateSection>
        </CardContent>
      </Card>

      {/* D5 — Corrective Actions */}
      <Card>
        <StepCardHeader title={t('d5Title')} description={t('d5Desc')} />
        <CardContent className="space-y-5">
          <TemplateSection title={t('actionPlanningTitle')} description={t('actionPlanningDesc')}>
            <ActionListManager<CorrectiveAction>
              items={d5.actions}
              onChange={(actions) => onChangeD5({ ...d5, actions })}
              emptyFactory={emptyCorrectiveAction}
              addLabel={t('addAction')}
              renderItem={(action, _idx, helpers) => (
                <>
                  <ActionItemHeader
                    label={`${t('correctiveAction')} ${helpers.index}`}
                    onRemove={helpers.remove}
                  />

                  <FormField
                    type="textarea"
                    label={t('correctiveAction')}
                    placeholder={t('correctiveActionPh')}
                    rows={2}
                    value={action.action}
                    onChange={(v) => helpers.updateField('action', v)}
                    error={actionErr(action.action)}
                  />

                  <div className="grid gap-4 xl:grid-cols-2">
                    <FormField
                      type="input"
                      label={t('relatedCause')}
                      placeholder={t('relatedCausePh')}
                      value={action.relatedRootCause}
                      onChange={(v) => helpers.updateField('relatedRootCause', v)}
                    />
                    <FormField
                      type="select"
                      label={t('linkedCauseType')}
                      value={action.linkedCauseType}
                      onChange={(v) => helpers.updateField('linkedCauseType', v as CorrectiveAction['linkedCauseType'])}
                      placeholder={t('linkedCauseType')}
                      options={[
                        { value: 'TUA', label: 'TUA' },
                        { value: 'TUN', label: 'TUN' },
                        { value: 'SUA', label: 'SUA' },
                        { value: 'SUN', label: 'SUN' },
                      ]}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    <FormField
                      type="input"
                      label={t('linkedCauseCode')}
                      placeholder={t('linkedCauseCodePh')}
                      value={action.linkedCauseCode}
                      onChange={(v) => helpers.updateField('linkedCauseCode', v)}
                    />
                    <FormField
                      type="input"
                      label={t('responsible')}
                      placeholder={t('responsible')}
                      value={action.responsible}
                      onChange={(v) => helpers.updateField('responsible', v)}
                    />
                    <FormField
                      type="select"
                      label={t('actionCategory')}
                      value={action.actionCategory}
                      onChange={(v) => helpers.updateField('actionCategory', v)}
                      placeholder={t('actionCategory')}
                      options={[
                        { value: 'technical', label: t('actionCategoryTechnical') },
                        { value: 'systemic', label: t('actionCategorySystemic') },
                      ]}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      type="date"
                      label={t('targetDate')}
                      value={action.targetDate}
                      onChange={(v) => helpers.updateField('targetDate', v)}
                      placeholder={t('targetDate')}
                      error={futureDateErr(action.targetDate)}
                    />
                    <FormField
                      type="input"
                      label={t('verification')}
                      placeholder={t('verificationPh')}
                      value={action.verificationMethod}
                      onChange={(v) => helpers.updateField('verificationMethod', v)}
                    />
                  </div>

                  <FormField
                    type="textarea"
                    label={t('notes')}
                    rows={2}
                    value={action.notes}
                    onChange={(v) => helpers.updateField('notes', v)}
                  />
                </>
              )}
            />
          </TemplateSection>

          <TemplateSection title={t('verificationPlanningTitle')} description={t('verificationPlanningDesc')}>
            <FormField
              type="textarea"
              label={t('plannedVerification')}
              placeholder={t('plannedVerificationPh')}
              rows={3}
              value={d5.plannedVerification}
              onChange={(v) => onChangeD5({ ...d5, plannedVerification: v })}
            />
          </TemplateSection>
        </CardContent>
      </Card>

      {/* Consistency check results */}
      <ConsistencyAlert result={consistencyResult} loading={consistencyLoading} />

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        nextDisabled={false}
        nextLabel={t('nextBtn')}
      />
    </div>
  )
}
