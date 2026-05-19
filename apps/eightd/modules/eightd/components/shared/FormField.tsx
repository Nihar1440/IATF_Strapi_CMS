'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/* ─── Field config types ─────────────────────────────────────────────── */

interface BaseFieldProps {
  id?: string
  label: string
  placeholder?: string
  className?: string
  /** Extra content rendered below the field (e.g. char count, hints) */
  extra?: ReactNode
  /** Validation error message to display below the field */
  error?: string
  /** Whether the field is required (visual indicator only) */
  required?: boolean
}

interface InputFieldProps extends BaseFieldProps {
  type: 'input'
  value: string
  onChange: (value: string) => void
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea'
  value: string
  onChange: (value: string) => void
  rows?: number
}

interface DateFieldProps extends BaseFieldProps {
  type: 'date'
  value: string
  onChange: (value: string) => void
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select'
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}

export type FormFieldProps =
  | InputFieldProps
  | TextareaFieldProps
  | DateFieldProps
  | SelectFieldProps

/* ─── Component ──────────────────────────────────────────────────────── */

export function FormField(props: FormFieldProps) {
  const { label, id, placeholder, className, extra, error } = props
  const errorBorder = error ? 'border-red-500 focus-visible:ring-red-500' : ''

  return (
    <div className={className ?? 'space-y-1.5'}>
      <Label htmlFor={id}>{label}</Label>

      {props.type === 'input' && (
        <Input
          id={id}
          placeholder={placeholder}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={cn(errorBorder)}
        />
      )}

      {props.type === 'textarea' && (
        <Textarea
          id={id}
          placeholder={placeholder}
          rows={props.rows ?? 3}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={cn(errorBorder)}
        />
      )}

      {props.type === 'date' && (
        <DatePicker
          value={props.value}
          onChange={(date) => props.onChange(date)}
          placeholder={placeholder}
          className={cn(errorBorder)}
        />
      )}

      {props.type === 'select' && (
        <Select
          value={props.value}
          onValueChange={(v) => props.onChange(v ?? '')}
        >
          <SelectTrigger className={cn(errorBorder)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {extra}
    </div>
  )
}
