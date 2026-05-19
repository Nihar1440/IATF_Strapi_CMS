'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StepNavigationProps {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  backDisabled?: boolean
  loading?: boolean
  loadingLabel?: string
  nextLabel?: string
  backLabel?: string
  /** Translation namespace for fallback labels — defaults to 'nav' */
  tNamespace?: string
}

export function StepNavigation({
  onBack,
  onNext,
  nextDisabled = false,
  backDisabled = false,
  loading = false,
  loadingLabel,
  nextLabel,
  backLabel,
}: StepNavigationProps) {
  const tNav = useTranslations('nav')

  return (
    <div className={onBack ? 'flex justify-between' : 'flex justify-end'}>
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          disabled={backDisabled || loading}
        >
          {backLabel ?? tNav('back')}
        </Button>
      )}
      <Button onClick={onNext} disabled={nextDisabled || loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel ?? tNav('loading')}
          </>
        ) : (
          nextLabel ?? tNav('next')
        )}
      </Button>
    </div>
  )
}
