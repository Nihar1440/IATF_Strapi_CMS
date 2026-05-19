'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────────── */

interface ActionListManagerProps<T extends { id: string }> {
  items: T[]
  onChange: (items: T[]) => void
  emptyFactory: () => T
  renderItem: (item: T, index: number, helpers: ActionItemHelpers<T>) => ReactNode
  addLabel: string
  emptyMessage?: string
}

export interface ActionItemHelpers<T extends { id: string }> {
  /** Update a single field on this item */
  updateField: <K extends keyof T>(field: K, value: T[K]) => void
  /** Remove this item from the list */
  remove: () => void
  /** The item's index label (1-based) */
  index: number
}

/* ─── Component ──────────────────────────────────────────────────────── */

export function ActionListManager<T extends { id: string }>({
  items,
  onChange,
  emptyFactory,
  renderItem,
  addLabel,
  emptyMessage,
}: ActionListManagerProps<T>) {
  const addItem = () => onChange([...items, emptyFactory()])

  const removeItem = (id: string) =>
    onChange(items.filter((item) => item.id !== id))

  const updateItem = (id: string, field: keyof T, value: T[keyof T]) =>
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )

  return (
    <>
      {items.length === 0 && emptyMessage && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}

      {items.map((item, idx) => (
        <Card key={item.id} className="border-dashed bg-background">
          <CardContent className="space-y-3 pt-4">
            {renderItem(item, idx, {
              updateField: (field, value) =>
                updateItem(item.id, field, value),
              remove: () => removeItem(item.id),
              index: idx + 1,
            })}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addItem}>
        <Plus className="mr-2 h-4 w-4" />
        {addLabel}
      </Button>
    </>
  )
}

/* ─── Shared action header row with delete button ────────────────────── */

export function ActionItemHeader({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium">{label}</p>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
