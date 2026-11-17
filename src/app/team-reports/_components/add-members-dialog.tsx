"use client"

import { useMemo, useState } from "react"
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
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
import type { Participant, TeamComparisonGroup } from "@/lib/types"
import { cn } from "@/lib/utils"

export type MemberProcedurePool = {
  id: string
  name: string
  participants: Participant[]
}

type Row = Participant & { procedureId: string; procedureName: string }

const NONE = "__none__"

function matchesQuery(p: Participant, q: string) {
  if (!q) return true
  return [p.fullName, p.position, p.vspUnit, p.sspUnit, p.externalLogin].some((v) =>
    v.toLowerCase().includes(q),
  )
}

function newGroupId() {
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Два шага: выбор сотрудников → опциональная группировка для сравнения в отчёте. */
export function AddMembersDialog({
  open,
  onOpenChange,
  procedures,
  initialProcedureId,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedures: MemberProcedurePool[]
  initialProcedureId?: string
  onAdd: (payload: {
    procedureId: string
    memberIds: string[]
    groups: TeamComparisonGroup[]
  }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        {open && (
          <Wizard
            procedures={procedures}
            initialProcedureId={initialProcedureId}
            onAdd={onAdd}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Wizard({
  procedures,
  initialProcedureId,
  onAdd,
  onClose,
}: {
  procedures: MemberProcedurePool[]
  initialProcedureId?: string
  onAdd: (payload: {
    procedureId: string
    memberIds: string[]
    groups: TeamComparisonGroup[]
  }) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [picked, setPicked] = useState<Row[]>([])
  const [draftGroups, setDraftGroups] = useState<Array<{ id: string; name: string }>>([])
  const [assignment, setAssignment] = useState<Record<string, string>>({})

  const procedureId = picked[0]?.procedureId ?? null

  function goToGrouping(rows: Row[]) {
    setPicked(rows)
    setDraftGroups([])
    setAssignment({})
    setStep(2)
  }

  function finish(withGroups: boolean) {
    if (!procedureId || picked.length === 0) return
    const memberIds = picked.map((p) => p.id)
    const groups: TeamComparisonGroup[] = withGroups
      ? draftGroups
          .map((g) => ({
            id: g.id,
            name: g.name.trim(),
            memberIds: memberIds.filter((id) => assignment[id] === g.id),
          }))
          .filter((g) => g.name && g.memberIds.length > 0)
      : []
    onAdd({ procedureId, memberIds, groups })
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Добавить участников в команду</DialogTitle>
        <DialogDescription>
          {step === 1
            ? "Шаг 1 из 2 — выберите сотрудников из процедуры."
            : "Шаг 2 из 2 — при желании разбейте участников на группы для сравнения в отчёте (тепловые карты, раздел «Группы участников»). Группировку можно пропустить."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-center gap-3 text-sm">
        <StepBadge n={1} active={step === 1} done={step === 2} label="Сотрудники" />
        <span className="text-base text-muted-foreground">→</span>
        <StepBadge n={2} active={step === 2} label="Группировка" />
      </div>

      {step === 1 ? (
        <SelectStep
          procedures={procedures}
          initialProcedureId={initialProcedureId}
          onNext={goToGrouping}
          onCancel={onClose}
        />
      ) : (
        <GroupingStep
          people={picked}
          draftGroups={draftGroups}
          assignment={assignment}
          onDraftGroupsChange={setDraftGroups}
          onAssignmentChange={setAssignment}
          onBack={() => setStep(1)}
          onSkip={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      )}
    </>
  )
}

function StepBadge({
  n,
  active,
  done,
  label,
}: {
  n: number
  active?: boolean
  done?: boolean
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        active && "bg-primary text-primary-foreground",
        done && "bg-muted text-foreground",
        !active && !done && "bg-muted/60 text-muted-foreground",
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-black/10 text-xs tabular-nums dark:bg-white/15">
        {n}
      </span>
      {label}
    </span>
  )
}

function SelectStep({
  procedures,
  initialProcedureId,
  onNext,
  onCancel,
}: {
  procedures: MemberProcedurePool[]
  initialProcedureId?: string
  onNext: (rows: Row[]) => void
  onCancel: () => void
}) {
  const defaultProcedureId =
    (initialProcedureId && procedures.some((p) => p.id === initialProcedureId)
      ? initialProcedureId
      : procedures[0]?.id) ?? null

  const [procedureId, setProcedureId] = useState<string | null>(defaultProcedureId)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const searching = q.length > 0

  const allRows = useMemo(() => {
    const rows: Row[] = []
    for (const proc of procedures) {
      for (const p of proc.participants) {
        if (!matchesQuery(p, q)) continue
        rows.push({ ...p, procedureId: proc.id, procedureName: proc.name })
      }
    }
    return rows
  }, [procedures, q])

  const rows = useMemo(() => {
    if (searching) return allRows
    if (!procedureId) return []
    return allRows.filter((r) => r.procedureId === procedureId)
  }, [allRows, searching, procedureId])

  const procedureMatchCount = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of allRows) counts.set(r.procedureId, (counts.get(r.procedureId) ?? 0) + 1)
    return counts
  }, [allRows])

  const selectAllProcedureId =
    (selectedProcedureId && rows.some((r) => r.procedureId === selectedProcedureId)
      ? selectedProcedureId
      : rows[0]?.procedureId) ?? null
  const selectAllRows = useMemo(
    () => (selectAllProcedureId ? rows.filter((r) => r.procedureId === selectAllProcedureId) : []),
    [rows, selectAllProcedureId],
  )
  const allSelected = selectAllRows.length > 0 && selectAllRows.every((r) => selected.has(r.id))
  const someSelected = selectAllRows.some((r) => selected.has(r.id))

  const rowById = useMemo(() => new Map(allRows.map((r) => [r.id, r])), [allRows])

  function toggle(row: Row, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked && selectedProcedureId && selectedProcedureId !== row.procedureId) next.clear()
      if (checked) {
        next.add(row.id)
        setSelectedProcedureId(row.procedureId)
      } else {
        next.delete(row.id)
        if (next.size === 0) setSelectedProcedureId(null)
      }
      return next
    })
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set())
      setSelectedProcedureId(null)
      return
    }
    if (!selectAllProcedureId) return
    setSelected(new Set(selectAllRows.map((r) => r.id)))
    setSelectedProcedureId(selectAllProcedureId)
  }

  const canNext = selected.size > 0 && selectedProcedureId !== null

  return (
    <>
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          placeholder="ФИО, должность, ССП, ВСП или логин — по всем процедурам"
          className="pl-8"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid min-h-96 gap-3 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-lg border">
          <div className="border-b bg-table-head px-3 py-2 text-xs font-semibold">Процедуры</div>
          <div className="max-h-96 overflow-y-auto md:max-h-[28rem]">
            {procedures.map((p) => {
              const activeItem = !searching && p.id === procedureId
              const matchCount = searching ? (procedureMatchCount.get(p.id) ?? 0) : p.participants.length
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b px-3 py-2.5 text-left text-xs last:border-b-0 hover:bg-muted/50",
                    activeItem && "bg-muted",
                    searching && matchCount === 0 && "opacity-50",
                  )}
                  onClick={() => {
                    setProcedureId(p.id)
                    if (searching) setQuery("")
                    setSelected(new Set())
                    setSelectedProcedureId(null)
                  }}
                >
                  <span className="font-medium whitespace-normal">{p.name}</span>
                  <span className="text-muted-foreground">
                    {matchCount} {pluralRu(matchCount, "участник", "участника", "участников")}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 border-b bg-table-head px-3 py-2 text-xs font-semibold sm:grid-cols-[auto_1.2fr_1fr_1fr_1.2fr]">
            <Checkbox
              disabled={rows.length === 0}
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(checked) => toggleAll(Boolean(checked))}
              aria-label="Выбрать всех найденных"
            />
            <span className="sm:col-span-3">Выбрать всех найденных ({rows.length})</span>
            <span className="hidden text-right sm:block sm:text-left">Процедура</span>
          </div>
          <div className="max-h-96 overflow-y-auto md:max-h-[28rem]">
            {rows.length === 0 ? (
              <p className="px-3 py-10 text-center text-xs text-muted-foreground">
                {searching ? "Никого не найдено" : "Выберите процедуру слева"}
              </p>
            ) : (
              rows.map((p) => (
                <label
                  key={`${p.procedureId}-${p.id}`}
                  className="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-2 border-b px-3 py-2 text-xs last:border-b-0 hover:bg-muted/50 sm:grid-cols-[auto_1.2fr_1fr_1fr_1.2fr] sm:gap-3"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.has(p.id)}
                    onCheckedChange={(checked) => toggle(p, Boolean(checked))}
                  />
                  <span className="font-medium">{p.fullName}</span>
                  <span className="text-muted-foreground">{p.position || "—"}</span>
                  <span className="text-muted-foreground">{p.sspUnit || "—"}</span>
                  <span className="text-muted-foreground">{p.procedureName}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          disabled={!canNext}
          onClick={() => {
            const chosen = [...selected]
              .map((id) => rowById.get(id))
              .filter((r): r is Row => r !== undefined && r.procedureId === selectedProcedureId)
            onNext(chosen)
          }}
        >
          Далее · группировка
        </Button>
      </DialogFooter>
    </>
  )
}

function GroupingStep({
  people,
  draftGroups,
  assignment,
  onDraftGroupsChange,
  onAssignmentChange,
  onBack,
  onSkip,
  onConfirm,
}: {
  people: Row[]
  draftGroups: Array<{ id: string; name: string }>
  assignment: Record<string, string>
  onDraftGroupsChange: (groups: Array<{ id: string; name: string }>) => void
  onAssignmentChange: (next: Record<string, string>) => void
  onBack: () => void
  onSkip: () => void
  onConfirm: () => void
}) {
  const groupItems = [
    { value: NONE, label: "Без группы" },
    ...draftGroups.map((g) => ({ value: g.id, label: g.name.trim() || "Без названия" })),
  ]

  function addGroup() {
    const id = newGroupId()
    onDraftGroupsChange([...draftGroups, { id, name: `Группа ${draftGroups.length + 1}` }])
  }

  function removeGroup(id: string) {
    onDraftGroupsChange(draftGroups.filter((g) => g.id !== id))
    const next = { ...assignment }
    for (const [pid, gid] of Object.entries(next)) {
      if (gid === id) delete next[pid]
    }
    onAssignmentChange(next)
  }

  const assignedCount = people.filter((p) => assignment[p.id] && assignment[p.id] !== NONE).length

  return (
    <>
      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        В отчёте группы сравниваются между собой (раздел «Группы участников», тепловые карты). Если
        группы не нужны — нажмите «Добавить без группировки».
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={addGroup}>
          <PlusIcon /> Создать группу
        </Button>
        <span className="text-xs text-muted-foreground">
          Выбрано {people.length}{" "}
          {pluralRu(people.length, "участник", "участника", "участников")}
          {draftGroups.length > 0 &&
            ` · в группах ${assignedCount}`}
        </span>
      </div>

      {draftGroups.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {draftGroups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
              <Input
                value={g.name}
                className="h-7 text-xs"
                placeholder="Название группы"
                onChange={(e) =>
                  onDraftGroupsChange(
                    draftGroups.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Удалить группу"
                onClick={() => removeGroup(g.id)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="max-h-80 overflow-auto rounded-lg border">
        <div className="grid grid-cols-[1fr_180px] gap-2 border-b bg-table-head px-3 py-2 text-xs font-semibold">
          <span>Участник</span>
          <span>Группа</span>
        </div>
        {people.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[1fr_180px] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.fullName}</p>
              <p className="truncate text-muted-foreground">{p.position || "—"}</p>
            </div>
            <Select
              items={groupItems}
              value={assignment[p.id] || NONE}
              onValueChange={(v) => {
                const next = { ...assignment }
                if (!v || v === NONE) delete next[p.id]
                else next[p.id] = v
                onAssignmentChange(next)
              }}
            >
              <SelectTrigger className="h-7 w-full text-xs" disabled={draftGroups.length === 0}>
                <SelectValue placeholder={draftGroups.length ? "Группа" : "Сначала создайте группу"} />
              </SelectTrigger>
              <SelectContent>
                {groupItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          Назад
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onSkip}>
            Добавить без группировки
          </Button>
          <Button onClick={onConfirm} disabled={draftGroups.length === 0 || assignedCount === 0}>
            Добавить с группировкой
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
