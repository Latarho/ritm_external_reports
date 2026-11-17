"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { ChartColumnIcon, DownloadIcon, LockIcon, LockOpenIcon, PlusIcon, UserMinusIcon } from "lucide-react"
import { toast } from "sonner"
import { AccessStatus } from "@/app/procedures/_components/access-status"
import { downloadParticipantsExcel } from "@/app/procedures/_components/excel"
import { Cell, EmptyState, HeadCell } from "@/app/procedures/_components/table-bits"
import { useParticipantView } from "@/app/procedures/_components/use-participant-view"
import { ParticipantAvatar } from "@/components/participant-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { pluralRu } from "@/lib/format"
import type { ProcedureOption, TeamReport, TeamReportInput } from "@/lib/types"
import {
  createTeamReportAction,
  setTeamReportAccessAction,
  updateTeamReportAction,
} from "../actions"
import { AddMembersDialog } from "./add-members-dialog"
import { LeaderPicker } from "./leader-picker"
import { TeamReportActionsMenu } from "./team-report-actions-menu"

function toInput(report: TeamReport | null): TeamReportInput {
  return {
    name: report?.name ?? "",
    procedureId: report?.procedureId ?? "",
    leaderId: report?.leaderId ?? "",
    memberIds: report?.memberIds ?? [],
  }
}

export function TeamReportEditor({
  report,
  procedures,
}: {
  report: TeamReport | null
  procedures: ProcedureOption[]
}) {
  const router = useRouter()
  const initial = useMemo(() => toInput(report), [report])
  const [form, setForm] = useState<TeamReportInput>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [pendingProcedure, setPendingProcedure] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // После сохранения сервер присылает свежие данные — синхронизируем форму.
  const [syncedFrom, setSyncedFrom] = useState(report)
  if (report !== syncedFrom) {
    setSyncedFrom(report)
    setForm(initial)
    setSelected(new Set())
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const procedure = procedures.find((p) => p.id === form.procedureId)
  const participants = useMemo(() => procedure?.participants ?? [], [procedure])
  const byId = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants])
  const leader = byId.get(form.leaderId)
  const members = useMemo(
    () => form.memberIds.map((id) => byId.get(id)).filter((p) => p !== undefined),
    [form.memberIds, byId],
  )
  const candidates = useMemo(() => {
    const taken = new Set([...form.memberIds, form.leaderId])
    return participants.filter((p) => !taken.has(p.id))
  }, [participants, form.memberIds, form.leaderId])

  const view = useParticipantView(members)
  const visibleIds = view.rows.map((p) => p.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected = visibleIds.some((id) => selected.has(id))

  const errors = {
    name: !form.name.trim() ? "Укажите название" : null,
    procedureId: !procedure ? "Выберите процедуру" : null,
    leaderId: !leader ? "Выберите руководителя" : null,
    members: members.length === 0 ? "Добавьте в команду хотя бы одного участника" : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : null)

  const procedureItems = procedures.map((p) => ({ value: p.id, label: p.name }))

  function set<K extends keyof TeamReportInput>(key: K, value: TeamReportInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function changeProcedure(id: string) {
    if (id === form.procedureId) return
    if (form.leaderId || form.memberIds.length) setPendingProcedure(id)
    else set("procedureId", id)
  }

  function setLeader(id: string) {
    // Руководитель не может одновременно быть участником команды.
    setForm((f) => ({ ...f, leaderId: id, memberIds: f.memberIds.filter((m) => m !== id) }))
  }

  function removeSelected() {
    const n = selected.size
    set("memberIds", form.memberIds.filter((id) => !selected.has(id)))
    setSelected(new Set())
    toast.success(
      `Из команды ${pluralRu(n, "убран", "убраны", "убраны")} ${n} ${pluralRu(n, "участник", "участника", "участников")}. Нажмите «Сохранить», чтобы применить изменения.`,
    )
  }

  function save() {
    setSubmitted(true)
    if (hasErrors) return void toast.error("Заполните обязательные поля и добавьте участников")
    startTransition(async () => {
      if (report) {
        const res = await updateTeamReportAction(report.id, form)
        if (!res.ok) return void toast.error(res.error)
        toast.success("Изменения сохранены")
        router.refresh()
      } else {
        const res = await createTeamReportAction(form)
        if (!res.ok) return void toast.error(res.error)
        toast.success("Командный отчёт создан")
        router.replace(`/team-reports/${res.data.id}`)
      }
    })
  }

  function toggleAccess() {
    if (!report) return
    startTransition(async () => {
      const next = report.reportAccess === "open" ? "closed" : "open"
      const res = await setTeamReportAccessAction(report.id, next)
      if (!res.ok) return void toast.error(res.error)
      toast.success(next === "open" ? "Доступ руководителю открыт" : "Доступ руководителю закрыт")
      router.refresh()
    })
  }

  if (procedures.length === 0 && !report) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-background p-10 text-center shadow-xs">
        <h1 className="text-base font-semibold">Нет запущенных процедур</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Командный отчёт собирается из участников процедуры, которая уже запущена. Запустите
          процедуру и возвращайтесь.
        </p>
        <Button render={<Link href="/procedures" />} nativeButton={false}>
          К списку процедур
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">Данные командного отчёта</h1>
          {report && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1 text-xs">
                Доступ руководителя: <AccessStatus access={report.reportAccess} />
              </span>
              <Button variant="outline" disabled={pending} onClick={toggleAccess}>
                {report.reportAccess === "open" ? <LockIcon /> : <LockOpenIcon />}
                {report.reportAccess === "open" ? "Закрыть доступ" : "Открыть доступ"}
              </Button>
              <Button
                variant="secondary"
                render={<Link href={`/team-reports/${report.id}/report`} />}
                nativeButton={false}
              >
                <ChartColumnIcon /> Просмотр отчёта
              </Button>
              <TeamReportActionsMenu
                id={report.id}
                name={report.name}
                access={report.reportAccess}
                showOpen={false}
                afterDelete={() => router.replace("/team-reports")}
              />
            </div>
          )}
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <Field id="name" label="Название" error={show("name")}>
            <Input
              id="name"
              value={form.name}
              placeholder="Например, команда отдела аналитики"
              aria-invalid={!!show("name") || undefined}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field id="procedure" label="Процедура" error={show("procedureId")}>
            <Select
              items={procedureItems}
              value={form.procedureId || null}
              onValueChange={(v) => v && changeProcedure(v)}
            >
              <SelectTrigger id="procedure" className="w-full" aria-invalid={!!show("procedureId") || undefined}>
                <SelectValue placeholder="Выберите запущенную процедуру" />
              </SelectTrigger>
              <SelectContent>
                {procedureItems.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="leader" label="Руководитель" error={show("leaderId")}>
            <LeaderPicker
              id="leader"
              participants={participants}
              value={form.leaderId}
              disabled={!procedure}
              invalid={!!show("leaderId")}
              placeholder={procedure ? "Выберите руководителя" : "Сначала выберите процедуру"}
              onChange={setLeader}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-base font-semibold">Состав команды</h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!procedure} onClick={() => setAddOpen(true)}>
              <PlusIcon /> Добавить участников
            </Button>
            <Button variant="destructive" disabled={selected.size === 0} onClick={removeSelected}>
              <UserMinusIcon /> Убрать из команды{selected.size > 0 && ` (${selected.size})`}
            </Button>
            <Button
              variant="secondary"
              className="ml-auto"
              disabled={members.length === 0 || pending}
              onClick={() =>
                startTransition(() => downloadParticipantsExcel(members, form.name || "Состав команды"))
              }
            >
              <DownloadIcon /> Скачать Excel
            </Button>
          </div>
          {!procedure && (
            <p className="text-xs text-muted-foreground">
              Выберите процедуру — участников команды можно добавить только из её участников.
            </p>
          )}

          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table className="min-w-[1000px] text-xs">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <HeadCell
                    className="w-10"
                    label={
                      <Checkbox
                        aria-label="Выбрать всех"
                        disabled={visibleIds.length === 0}
                        checked={allSelected}
                        indeterminate={!allSelected && someSelected}
                        onCheckedChange={(checked) => {
                          const next = new Set(selected)
                          for (const id of visibleIds) {
                            if (checked) next.add(id)
                            else next.delete(id)
                          }
                          setSelected(next)
                        }}
                      />
                    }
                  />
                  <HeadCell label="" className="w-12" />
                  <HeadCell label="ФИО" view={view} sortKey="fullName" searchKey="fullName" />
                  <HeadCell label="Должность" view={view} filterKey="position" participants={members} />
                  <HeadCell label="Подразделение ССП" view={view} filterKey="sspUnit" participants={members} />
                  <HeadCell label="Подразделение ВСП" view={view} filterKey="vspUnit" participants={members} />
                  <HeadCell label="Внешний логин" view={view} searchKey="externalLogin" />
                  <HeadCell label="Личный отчёт" className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rows.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8}>
                      <EmptyState filtered={view.isFiltered} onReset={view.reset} />
                    </TableCell>
                  </TableRow>
                )}
                {view.rows.map((p) => (
                  <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Выбрать ${p.fullName}`}
                        checked={selected.has(p.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selected)
                          if (checked) next.add(p.id)
                          else next.delete(p.id)
                          setSelected(next)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <ParticipantAvatar fullName={p.fullName} />
                    </TableCell>
                    <TableCell className="whitespace-normal">{p.fullName}</TableCell>
                    <TableCell className="whitespace-normal"><Cell>{p.position}</Cell></TableCell>
                    <TableCell className="whitespace-normal"><Cell>{p.sspUnit}</Cell></TableCell>
                    <TableCell className="whitespace-normal"><Cell>{p.vspUnit}</Cell></TableCell>
                    <TableCell>{p.externalLogin}</TableCell>
                    <TableCell>
                      <AccessStatus access={p.reportAccess} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className={show("members") ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {show("members") ??
              (members.length > 0
                ? `В команде ${members.length} ${pluralRu(members.length, "участник", "участника", "участников")}` +
                  (leader ? " и руководитель" : "") +
                  (view.isFiltered ? `, показано ${view.rows.length}` : "")
                : null)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
          <Button size="lg" className="px-4" disabled={pending} onClick={save}>
            Сохранить
          </Button>
          {dirty && <span className="text-xs text-muted-foreground">Есть несохранённые изменения</span>}
        </div>
      </section>

      <AddMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        candidates={candidates}
        onAdd={(ids) => {
          set("memberIds", [...form.memberIds, ...ids])
          setAddOpen(false)
          toast.success(
            `Добавлено ${ids.length} ${pluralRu(ids.length, "участник", "участника", "участников")}`,
          )
        }}
      />


      <AlertDialog open={pendingProcedure !== null} onOpenChange={(o) => !o && setPendingProcedure(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сменить процедуру?</AlertDialogTitle>
            <AlertDialogDescription>
              Руководитель и состав команды будут сброшены: участников можно выбрать только из
              выбранной процедуры.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setForm((f) => ({ ...f, procedureId: pendingProcedure!, leaderId: "", memberIds: [] }))
                setSelected(new Set())
                setPendingProcedure(null)
              }}
            >
              Сменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        <span className="text-destructive">*</span>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
