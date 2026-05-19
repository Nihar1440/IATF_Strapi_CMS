'use client'

import type { SystemicCause } from '@/modules/eightd/types/report'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

interface SystemicCauseCardProps {
  label: string
  description: string
  value: SystemicCause
  onChange: (updated: SystemicCause) => void
}

export function SystemicCauseCard({
  label,
  description,
  value,
  onChange,
}: SystemicCauseCardProps) {
  const t = useTranslations('s4')

  const update = (field: keyof SystemicCause, val: string) =>
    onChange({ ...value, [field]: val })

  return (
    <div className="rounded-xl border bg-background p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-1.5">
        <Label>{t('systemicCause')}</Label>
        <Textarea
          rows={3}
          value={value.cause}
          onChange={(e) => update('cause', e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('causeCode')}</Label>
          <Input
            placeholder={t('causeCodePh')}
            value={value.causeCode}
            onChange={(e) => update('causeCode', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('derivedFrom')}</Label>
          <Input
            value={value.derivedFrom}
            onChange={(e) => update('derivedFrom', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
