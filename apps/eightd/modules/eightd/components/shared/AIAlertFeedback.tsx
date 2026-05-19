'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SufficiencyResult, ConsistencyResult, SufficiencyField } from '@/modules/eightd/types/ai'

/* ─── Sufficiency alerts ─────────────────────────────────────────────── */

export function SufficiencyAlert({
  result,
  onIssueClick,
}: {
  result: SufficiencyResult | null
  onIssueClick?: (field: SufficiencyField) => void
}) {
  const tAi = useTranslations('ai')
  if (!result) return null

  if (result.sufficient) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          {tAi('sufficiency.pass')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{tAi('sufficiency.failTitle')}</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{tAi('sufficiency.fail')}</p>
        <div className="space-y-1.5">
          {result.issues.map((issue, i) => (
            <div key={`${issue.field}-${i}`} className="text-sm">
              {onIssueClick ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-left text-sm text-destructive underline-offset-4 hover:underline"
                  onClick={() => onIssueClick(issue.field)}
                >
                  {issue.message}
                </Button>
              ) : (
                <span>{issue.message}</span>
              )}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/* ─── Consistency alerts ─────────────────────────────────────────────── */

export function ConsistencyAlert({
  result,
  loading,
}: {
  result: ConsistencyResult | null
  loading: boolean
}) {
  const tAi = useTranslations('ai')

  if (loading) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          {tAi('consistency.checking')}
        </AlertDescription>
      </Alert>
    )
  }

  if (!result) return null

  if (result.consistent) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          {tAi('consistency.pass')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">
        {tAi('consistency.failTitle')}
      </AlertTitle>
      <AlertDescription>
        {result.issues.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-amber-800">
              {tAi('consistency.issues')}
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700">
              {result.issues.map((issue: string, i: number) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {result.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-800">
              {tAi('consistency.suggestions')}
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700">
              {result.suggestions.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/* ─── AI Error alert ─────────────────────────────────────────────────── */

export function AIErrorAlert({
  error,
  onRetry,
  onManual,
  retryDisabled,
}: {
  error: string | null
  onRetry?: () => void
  onManual?: () => void
  retryDisabled?: boolean
}) {
  const tAi = useTranslations('ai')
  if (!error) return null

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{tAi('error')}</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{onRetry ? tAi('failedMsg') : error}</p>
        {(onRetry || onManual) && (
          <div className="flex gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={retryDisabled}
              >
                {tAi('retryBtn')}
              </Button>
            )}
            {onManual && (
              <Button size="sm" variant="ghost" onClick={onManual}>
                {tAi('manualBtn')}
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/* ─── Simple generation error alert (no retry/manual) ────────────────── */

export function GenerationErrorAlert({
  error,
}: {
  error: string | null
}) {
  const tAi = useTranslations('ai')
  if (!error) return null

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{tAi('error')}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}
