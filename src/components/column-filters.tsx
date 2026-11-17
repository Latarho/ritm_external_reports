"use client"

import { FilterIcon, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const triggerClass =
  "inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground data-[active=true]:text-primary"

/** Поиск по текстовой колонке. */
export function ColumnSearch({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={triggerClass}
            data-active={Boolean(value)}
            aria-label={`Поиск по полю «${label}»`}
          />
        }
      >
        <SearchIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="relative">
          <Input
            autoFocus
            value={value}
            placeholder={`Поиск: ${label.toLowerCase()}`}
            onChange={(e) => onChange(e.target.value)}
            className="pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export interface FilterOption {
  value: string
  label: string
}

/** Фильтр по списку значений колонки. Пустой выбор = без фильтра. */
export function ColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}) {
  function toggle(value: string, checked: boolean) {
    onChange(checked ? [...selected, value] : selected.filter((v) => v !== value))
  }
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={triggerClass}
            data-active={selected.length > 0}
            aria-label={`Фильтр по полю «${label}»`}
          />
        }
      >
        <FilterIcon className={cn("size-3.5", selected.length > 0 && "fill-current")} />
      </PopoverTrigger>
      <PopoverContent className="w-72 gap-1 p-2" align="start">
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">Нет значений</p>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
            >
              <Checkbox
                className="mt-px"
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) => toggle(opt.value, checked)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="justify-start" onClick={() => onChange([])}>
            Сбросить фильтр
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function uniqueOptions(values: string[], emptyLabel = "Не указано"): FilterOption[] {
  const set = new Set(values)
  return [...set]
    .sort((a, b) => a.localeCompare(b, "ru"))
    .map((v) => ({ value: v, label: v || emptyLabel }))
}
