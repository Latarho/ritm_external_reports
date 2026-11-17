"use client"

import { useState } from "react"
import { parseISO } from "date-fns"
import { ru } from "react-day-picker/locale"
import { CalendarDaysIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate, toIsoDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  minDate,
}: {
  id?: string
  /** yyyy-mm-dd или пустая строка */
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  invalid?: boolean
  minDate?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            data-invalid={invalid || undefined}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <span className="truncate">{value ? formatDate(value) : placeholder}</span>
        <CalendarDaysIcon className={cn("size-4 shrink-0", disabled ? "text-muted-foreground" : "text-primary")} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          locale={ru}
          selected={selected}
          defaultMonth={selected ?? (minDate ? parseISO(minDate) : undefined)}
          disabled={minDate ? { before: parseISO(minDate) } : undefined}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
