"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { ParticipantAvatar } from "@/components/participant-avatar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Participant } from "@/lib/types"
import { cn } from "@/lib/utils"

const LIMIT = 100

/** Выбор руководителя из участников процедуры с поиском. */
export function LeaderPicker({
  id,
  participants,
  value,
  onChange,
  disabled,
  invalid,
  placeholder,
}: {
  id?: string
  participants: Participant[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  invalid?: boolean
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selected = participants.find((p) => p.id === value)

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return participants
    return participants.filter((p) =>
      [p.fullName, p.position, p.externalLogin].some((v) => v.toLowerCase().includes(q)),
    )
  }, [participants, query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            data-invalid={invalid || undefined}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20",
              !selected && "text-muted-foreground",
            )}
          />
        }
      >
        <span className="truncate">{selected ? selected.fullName : placeholder}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) min-w-72 gap-2 p-2" align="start">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            placeholder="ФИО, должность или логин"
            className="pl-8"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div role="listbox" aria-label="Участники процедуры" className="max-h-72 overflow-y-auto">
          {found.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Никого не найдено</p>
          )}
          {found.slice(0, LIMIT).map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === value}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
              onClick={() => {
                onChange(p.id)
                setOpen(false)
                setQuery("")
              }}
            >
              <ParticipantAvatar fullName={p.fullName} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.fullName}</span>
                <span className="block truncate text-muted-foreground">{p.position || "—"}</span>
              </span>
              {p.id === value && <CheckIcon className="size-4 text-primary" />}
            </button>
          ))}
          {found.length > LIMIT && (
            <p className="px-2 py-2 text-center text-xs text-muted-foreground">
              Показаны первые {LIMIT} из {found.length}. Уточните поиск.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
