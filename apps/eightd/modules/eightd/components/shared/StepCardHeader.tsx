import { CardHeader, CardTitle } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface StepCardHeaderProps {
  title: string
  description?: string
  templateFlow?: string
  /** Optional extra content rendered after the title row (e.g. AI badge + regenerate) */
  actions?: ReactNode
  /** Extra content below the template-flow line */
  extra?: ReactNode
}

export function StepCardHeader({
  title,
  description,
  templateFlow,
  actions,
  extra,
}: StepCardHeaderProps) {
  return (
    <CardHeader>
      {actions ? (
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      ) : (
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {templateFlow && (
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {templateFlow}
        </p>
      )}
      {extra}
    </CardHeader>
  )
}
