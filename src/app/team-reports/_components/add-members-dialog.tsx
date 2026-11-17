"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { pluralRu } from "@/lib/format"
import type { Participant } from "@/lib/types"

const ALL = "__all__"

/** Выбор участников процедуры для добавления в команду. */
export function AddMembersDialog({
  open,
  onOpenChange,
  candidates,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Участники процедуры, которых ещё нет в команде */
  candidates: Participant[]
  onAdd: (ids: string[]) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && <Picker candidates={candidates} onAdd={onAdd} />}
      </DialogContent>
    </Dialog>
  )
}

function Picker({
  candidates,
  onAdd,
}: {
  candidates: Participant[]
  onAdd: (ids: string[]) => void
}) {
  const [query, setQuery] = useState("")
  const [unit, setUnit] = useState<string>(ALL)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const units = useMemo(
    () => [...new Set(candidates.map((p) => p.sspUnit).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru")),
    [candidates],
  )
  const unitItems = [{ value: ALL, label: "Все подразделения ССП" }, ...units.map((u) => ({ value: u, label: u }))]

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates.filter((p) => {
      if (unit !== ALL && p.sspUnit !== unit) return false
      if (!q) return true
      return [p.fullName, p.position, p.vspUnit, p.externalLogin].some((v) => v.toLowerCase().includes(q))
    })
  }, [candidates, query, unit])

  const allFound = found.length > 0 && found.every((p) => selected.has(p.id))
  const someFound = found.some((p) => selected.has(p.id))

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Добавить участников в команду</DialogTitle>
        <DialogDescription>
          Выберите сотрудников из участников процедуры. Руководитель и уже добавленные в список не
          попадают.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            placeholder="ФИО, должность, ВСП или логин"
            className="pl-8"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select items={unitItems} value={unit} onValueChange={(v) => setUnit(v ?? ALL)}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Подразделение ССП">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitItems.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <label className="flex items-center gap-2 border-b bg-table-head px-3 py-2 text-xs font-semibold">
          <Checkbox
            disabled={found.length === 0}
            checked={allFound}
            indeterminate={!allFound && someFound}
            onCheckedChange={(checked) => {
              const next = new Set(selected)
              for (const p of found) {
                if (checked) next.add(p.id)
                else next.delete(p.id)
              }
              setSelected(next)
            }}
          />
          Выбрать всех найденных ({found.length})
        </label>
        <div className="max-h-80 overflow-y-auto">
          {found.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {candidates.length === 0 ? "Все участники процедуры уже в команде" : "Никого не найдено"}
            </p>
          )}
          {found.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-start gap-2 border-b px-3 py-2 text-xs last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                className="mt-0.5"
                checked={selected.has(p.id)}
                onCheckedChange={(checked) => toggle(p.id, checked)}
              />
              <span className="grid flex-1 gap-0.5 sm:grid-cols-[1.2fr_1fr_1.4fr] sm:gap-3">
                <span className="font-medium">{p.fullName}</span>
                <span className="text-muted-foreground">{p.position || "—"}</span>
                <span className="text-muted-foreground">{p.sspUnit || "—"}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button disabled={selected.size === 0} onClick={() => onAdd([...selected])}>
          Добавить
          {selected.size > 0 &&
            ` ${selected.size} ${pluralRu(selected.size, "участника", "участников", "участников")}`}
        </Button>
      </DialogFooter>
    </>
  )
}
