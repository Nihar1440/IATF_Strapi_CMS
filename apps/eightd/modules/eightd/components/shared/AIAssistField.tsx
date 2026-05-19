'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AssistResult } from '@/modules/eightd/types/ai'
import { cn } from '@/lib/utils'

interface AIAssistFieldProps {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  /** The AI assist hook */
  onAssist: (fieldName: string, fieldValue: string) => Promise<void>
  assistLoading: boolean
  assistResult: AssistResult | null
  onApply: (fieldName: string) => void
  onDismiss: () => void
  /** Name used to track which field the assist is for */
  fieldName: string
  /** Which field is currently being assisted (so we only show result for this one) */
  activeAssistField: string | null
  /** Extra content below the textarea (e.g. char count) */
  extra?: React.ReactNode
  /** Validation error message to display below the field */
  error?: string
  /** Optional override for the assist button label */
  assistLabel?: string
}

export function AIAssistField({
  id,
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  onAssist,
  assistLoading,
  assistResult,
  onApply,
  onDismiss,
  fieldName,
  activeAssistField,
  extra,
  error,
  assistLabel,
}: AIAssistFieldProps) {
  const tAi = useTranslations('ai')
  const isActiveField = activeAssistField === fieldName

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={assistLoading || !value.trim()}
          onClick={() => onAssist(fieldName, value)}
        >
          {assistLoading && isActiveField ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-3 w-3" />
          )}
          {assistLabel ?? tAi('assist.btn')}
        </Button>
      </div>

      <Textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {extra}

      {isActiveField && assistResult && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs font-medium text-blue-800">
            {tAi('assist.improved')}
          </p>
          <p className="text-sm text-blue-900">{assistResult.improved}</p>
          {assistResult.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-800">
                {tAi('assist.suggestions')}
              </p>
              <ul className="text-xs text-blue-700 list-disc list-inside">
                {assistResult.suggestions.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={() => onApply(fieldName)}
            >
              {tAi('assist.apply')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={onDismiss}
            >
              {tAi('assist.dismiss')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
