import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TemplateSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function TemplateSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: TemplateSectionProps) {
  return (
    <section className={cn('rounded-xl border bg-muted/20 p-4 sm:p-5', className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn('mt-4 space-y-4', contentClassName)}>{children}</div>
    </section>
  )
}
