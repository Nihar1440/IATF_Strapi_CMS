"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { createPortal } from "react-dom"

import { cn } from "./lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  
  // Convert string to Date object
  const selectedDate = value ? new Date(value) : undefined

  // Calculate position when opening
  const updatePosition = React.useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      updatePosition()
    }
  }, [open, updatePosition])

  // Close on scroll or click outside
  React.useEffect(() => {
    if (!open) return
    
    const handleScroll = () => {
      setOpen(false)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (buttonRef.current && !buttonRef.current.contains(target) && 
          !target.closest('[data-calendar-portal]')) {
        setOpen(false)
      }
    }

    const handleResize = () => {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Format as YYYY-MM-DD for consistency with HTML date input
      const formattedDate = format(date, "yyyy-MM-dd")
      onChange(formattedDate)
    }
    setOpen(false)
  }

  const calendarContent = open && typeof window !== 'undefined' ? createPortal(
    <div 
      data-calendar-portal
      className="fixed z-[99999] rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-lg ring-1 ring-border"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '280px'
      }}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        initialFocus
        className="w-full"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center items-center relative h-12 mb-2 px-2",
          caption_label: "text-sm font-medium order-2 pointer-events-none",
          nav: "absolute inset-x-0 top-0 flex justify-between items-center h-12 px-2 z-10",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-md transition-all flex items-center justify-center"
          ),
          nav_button_previous: "order-1",
          nav_button_next: "order-3",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
    </div>,
    document.body
  ) : null

  return (
    <>
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          // Match input height and styling exactly
          "h-8 w-full min-w-0 justify-start text-left font-normal px-2.5 py-1",
          // Input-like appearance
          "border-input bg-transparent text-base transition-colors outline-none",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
          // Empty state styling
          !selectedDate && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {selectedDate ? (
          <span className="text-foreground font-medium">
            {format(selectedDate, "PPP")}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
      </Button>
      {calendarContent}
    </>
  )
}