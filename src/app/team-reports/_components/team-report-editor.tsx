"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { DownloadIcon, FileTextIcon, LockIcon, LockOpenIcon, PlusIcon, UploadIcon, UserMinusIcon } from "lucide-react"
import { toast } from "sonner"
import { AccessStatus } from "@/app/procedures/_components/access-status"
import { importParticipantsAction } from "@/app/procedures/actions"
import { downloadParticipantsExcel } from "@/app/procedures/_components/excel"
import { ReportDialog } from "@/app/procedures/_components/report-dialog"
import { Cell, EmptyState, HeadCell } from "@/app/procedures/_components/table-bits"
import { useParticipantView } from "@/app/procedures/_components/use-participant-view"
import { ParticipantAvatar } from "@/components/participant-avatar"
import { SimplePagination } from "@/components/simple-pagination"
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
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { formatLastChange, pluralRu } from "@/lib/format"
import type { Participant, ProcedureOption, ReportAccess, TeamReport, TeamReportInput } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  createTeamReportAction,
  setTeamReportAccessAction,
  updateTeamReportAction,
  type TeamReportAccessAudience,
} from "../actions"
import { AddMembersDialog } from "./add-members-dialog"
import { EmailSentStatus } from "./email-sent-status"
import { PeopleMultiPicker } from "./people-multi-picker"

type Person = Participant & { procedureId: string }

const MEMBERS_PAGE_SIZE = 10

function toInput(report: TeamReport | null): TeamReportInput {
  return {
    name: report?.name ?? "",
    procedureId: report?.procedureId ?? "",
    leaderIds: report?.leaderIds ?? [],
    hrbpIds: report?.hrbpIds ?? [],
    memberIds: report?.memberIds ?? [],
    groups: report?.groups ?? [],
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
  const [personalReport, setPersonalReport] = useState<Person | null>(null)
  const [membersPage, setMembersPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const excelInputRef = useRef<HTMLInputElement>(null)

  // После сохранения сервер присылает свежие данные — синхронизируем форму.
  const [syncedFrom, setSyncedFrom] = useState(report)
  if (report !== syncedFrom) {
    setSyncedFrom(report)
    setForm(initial)
    setSelected(new Set())
    setMembersPage(1)
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const people = useMemo<Person[]>(
    () => procedures.flatMap((p) => p.participants.map((person) => ({ ...person, procedureId: p.id }))),
    [procedures],
  )
  const procedureNameById = useMemo(
    () => new Map(procedures.map((p) => [p.id, p.name])),
    [procedures],
  )
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const leaders = useMemo(
    () => form.leaderIds.map((id) => byId.get(id)).filter((p) => p !== undefined),
    [form.leaderIds, byId],
  )
  const members = useMemo(
    () => form.memberIds.map((id) => byId.get(id)).filter((p) => p !== undefined),
    [form.memberIds, byId],
  )
  const procedureId =
    leaders[0]?.procedureId ?? members[0]?.procedureId ?? form.procedureId
  const procedurePeople = useMemo(
    () => (procedureId ? people.filter((p) => p.procedureId === procedureId) : []),
    [people, procedureId],
  )
  const leaderCandidates = useMemo(
    () => (procedureId ? procedurePeople : people),
    [procedureId, people, procedurePeople],
  )
  const leaderSet = useMemo(() => new Set(form.leaderIds), [form.leaderIds])
  const takenIds = useMemo(
    () => new Set([...form.leaderIds, ...form.memberIds]),
    [form.leaderIds, form.memberIds],
  )
  const memberProcedures = useMemo(
    () =>
      procedures
        .map((p) => ({
          id: p.id,
          name: p.name,
          participants: p.participants.filter((person) => !takenIds.has(person.id)),
        }))
        .filter((p) => p.participants.length > 0),
    [procedures, takenIds],
  )
  const hrbpCandidates = useMemo(
    () => people.filter((p) => !leaderSet.has(p.id)),
    [people, leaderSet],
  )

  const view = useParticipantView(members)
  const membersPageCount = Math.max(1, Math.ceil(view.rows.length / MEMBERS_PAGE_SIZE))
  const currentMembersPage = Math.min(membersPage, membersPageCount)
  const pageRows = view.rows.slice(
    (currentMembersPage - 1) * MEMBERS_PAGE_SIZE,
    currentMembersPage * MEMBERS_PAGE_SIZE,
  )
  const visibleIds = pageRows.map((p) => p.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected = visibleIds.some((id) => selected.has(id))

  useEffect(() => {
    setMembersPage(1)
  }, [view.rows.length, view.isFiltered])

  const errors = {
    name: !form.name.trim() ? "Укажите название" : null,
    members: members.length === 0 ? "Добавьте в команду хотя бы одного участника" : null,
    procedureId: members.length > 0 && !procedureId ? "Не удалось определить процедуру команды" : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : null)

  function set<K extends keyof TeamReportInput>(key: K, value: TeamReportInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setLeaders(ids: string[]) {
    if (ids.length === 0) {
      setForm((f) => ({ ...f, leaderIds: [] }))
      return
    }
    const first = byId.get(ids[0])
    if (!first) return
    const nextIds = ids.filter((id) => byId.get(id)?.procedureId === first.procedureId)
    const nextSet = new Set(nextIds)
    setForm((f) => {
      const sameProcedure = f.procedureId === first.procedureId
      const memberIds = sameProcedure ? f.memberIds.filter((m) => !nextSet.has(m)) : []
      return {
        ...f,
        leaderIds: nextIds,
        procedureId: first.procedureId,
        memberIds,
        // Сотрудники ДРП не зависят от процедуры руководителя — только убираем пересечение с ними.
        hrbpIds: f.hrbpIds.filter((h) => !nextSet.has(h)),
        groups: sameProcedure
          ? f.groups
              .map((g) => ({ ...g, memberIds: g.memberIds.filter((id) => memberIds.includes(id)) }))
              .filter((g) => g.memberIds.length > 0)
          : [],
      }
    })
    if (form.procedureId && form.procedureId !== first.procedureId) setSelected(new Set())
  }

  function removeSelected() {
    const n = selected.size
    const memberIds = form.memberIds.filter((id) => !selected.has(id))
    setForm((f) => ({
      ...f,
      memberIds,
      groups: f.groups
        .map((g) => ({ ...g, memberIds: g.memberIds.filter((id) => !selected.has(id)) }))
        .filter((g) => g.memberIds.length > 0),
    }))
    setSelected(new Set())
    toast.success(
      `Из команды ${pluralRu(n, "убран", "убраны", "убраны")} ${n} ${pluralRu(n, "участник", "участника", "участников")}. Нажмите «Сохранить», чтобы применить изменения.`,
    )
  }

  /** Загрузка Excel: сопоставление по внешнему логину с участниками запущенных процедур. */
  function importExcel(file: File) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("file", file)
      const res = await importParticipantsAction(fd)
      if (!res.ok) return void toast.error(res.error)

      const byLogin = new Map<string, Person[]>()
      for (const person of people) {
        const key = person.externalLogin.trim().toLowerCase()
        if (!key) continue
        const list = byLogin.get(key) ?? []
        list.push(person)
        byLogin.set(key, list)
      }

      const preferredProcedureId = procedureId || null
      const matched: Person[] = []
      let unknown = 0
      let duplicates = 0

      for (const row of res.data.participants) {
        const key = row.externalLogin.trim().toLowerCase()
        if (!key) {
          unknown++
          continue
        }
        const candidates = byLogin.get(key) ?? []
        if (candidates.length === 0) {
          unknown++
          continue
        }
        const person =
          (preferredProcedureId
            ? candidates.find((c) => c.procedureId === preferredProcedureId)
            : undefined) ?? candidates[0]
        if (matched.some((m) => m.id === person.id) || form.memberIds.includes(person.id)) {
          duplicates++
          continue
        }
        if (form.leaderIds.includes(person.id)) {
          duplicates++
          continue
        }
        matched.push(person)
      }

      if (matched.length === 0) {
        return void toast.warning(
          unknown || duplicates
            ? "Новых участников не добавлено: логины не найдены в процедурах или уже в команде"
            : "В файле нет строк с сотрудниками",
        )
      }

      // Команда из одной процедуры: берём процедуру большинства совпадений.
      const countByProc = new Map<string, number>()
      for (const m of matched) countByProc.set(m.procedureId, (countByProc.get(m.procedureId) ?? 0) + 1)
      let targetProcedureId = preferredProcedureId ?? matched[0].procedureId
      let best = 0
      for (const [id, count] of countByProc) {
        if (count > best) {
          best = count
          targetProcedureId = id
        }
      }
      const accepted = matched.filter((m) => m.procedureId === targetProcedureId)
      const skippedOtherProc = matched.length - accepted.length

      setForm((f) => {
        const inProcedure = new Set(
          procedures.find((p) => p.id === targetProcedureId)?.participants.map((p) => p.id) ?? [],
        )
        const keptMembers =
          f.procedureId === targetProcedureId ? f.memberIds.filter((id) => inProcedure.has(id)) : []
        const memberIds = [...new Set([...keptMembers, ...accepted.map((m) => m.id)])]
        return {
          ...f,
          procedureId: targetProcedureId,
          memberIds,
          leaderIds: f.leaderIds.filter((id) => inProcedure.has(id)),
          groups:
            f.procedureId === targetProcedureId
              ? f.groups
                  .map((g) => ({
                    ...g,
                    memberIds: g.memberIds.filter((id) => memberIds.includes(id)),
                  }))
                  .filter((g) => g.memberIds.length > 0)
              : [],
        }
      })

      toast.success(
        `Загружено: ${accepted.length}` +
          (unknown || duplicates || skippedOtherProc
            ? `, пропущено: ${unknown + duplicates + skippedOtherProc}`
            : "") +
          ". Нажмите «Сохранить», чтобы применить изменения.",
      )
    })
  }

  function save() {
    setSubmitted(true)
    if (hasErrors) return void toast.error("Заполните обязательные поля и добавьте участников")
    const payload: TeamReportInput = {
      ...form,
      procedureId,
    }
    startTransition(async () => {
      if (report) {
        const res = await updateTeamReportAction(report.id, payload)
        if (!res.ok) return void toast.error(res.error)
        toast.success("Изменения сохранены")
        router.refresh()
      } else {
        const res = await createTeamReportAction(payload)
        if (!res.ok) return void toast.error(res.error)
        toast.success("Командный отчёт создан")
        router.replace(`/team-reports/${res.data.id}`)
      }
    })
  }

  function toggleAccess(audience: TeamReportAccessAudience, sendEmail = false) {
    if (!report) return
    const current = audience === "hrbp" ? report.hrbpReportAccess : report.reportAccess
    const next: Exclude<ReportAccess, null> = current === "open" ? "closed" : "open"
    startTransition(async () => {
      const res = await setTeamReportAccessAction(report.id, next, audience, { sendEmail })
      if (!res.ok) return void toast.error(res.error)
      const opened = next === "open"
      toast.success(
        audience === "hrbp"
          ? opened
            ? sendEmail
              ? "Доступ сотрудника ДРП открыт, письмо отправлено"
              : "Доступ сотрудника ДРП открыт"
            : "Доступ сотрудника ДРП закрыт"
          : opened
            ? sendEmail
              ? "Доступ руководителю открыт, письмо отправлено"
              : "Доступ руководителю открыт"
            : "Доступ руководителю закрыт",
      )
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
            <Button
              className="ml-auto"
              variant="secondary"
              render={<Link href={`/team-reports/${report.id}/report`} />}
              nativeButton={false}
            >
              <FileTextIcon /> Командный отчёт
            </Button>
          )}
        </div>
        <div className="grid gap-5 p-4">
          <Field id="name" label="Название" error={show("name")} required>
            <Input
              id="name"
              className="max-w-xl"
              value={form.name}
              placeholder="Например, команда отдела аналитики"
              aria-invalid={!!show("name") || undefined}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <Field id="leader" label="Руководитель">
                <PeopleMultiPicker
                  id="leader"
                  participants={leaderCandidates}
                  value={form.leaderIds}
                  disabled={people.length === 0}
                  placeholder="Выберите руководителей"
                  listLabel="Руководители"
                  removeRoleLabel="руководителя"
                  onChange={setLeaders}
                />
              </Field>
              {report && (
                <AccessControls
                  label="Доступ для руководителя"
                  access={report.reportAccess}
                  emailSent={report.reportEmailSent}
                  pending={pending}
                  onToggle={(sendEmail) => toggleAccess("leader", sendEmail)}
                />
              )}
            </div>

            <div className="grid content-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <Field id="hrbp" label="Сотрудник ДРП">
                <PeopleMultiPicker
                  id="hrbp"
                  participants={hrbpCandidates}
                  value={form.hrbpIds}
                  disabled={people.length === 0}
                  placeholder="Выберите сотрудников ДРП"
                  listLabel="Сотрудники ДРП"
                  removeRoleLabel="сотрудника ДРП"
                  onChange={(ids) => set("hrbpIds", ids)}
                />
              </Field>
              {report && (
                <AccessControls
                  label="Доступ для сотрудника ДРП"
                  access={report.hrbpReportAccess ?? "closed"}
                  emailSent={report.hrbpEmailSent}
                  pending={pending}
                  onToggle={(sendEmail) => toggleAccess("hrbp", sendEmail)}
                />
              )}
            </div>
          </div>
        </div>
        {report && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t px-4 py-3 text-xs text-muted-foreground">
            <span>Создатель отчёта: {report.creator}</span>
            <span>Последнее изменение: {formatLastChange(report.updatedAt, report.updatedBy)}</span>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-base font-semibold">Список сотрудников</h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={memberProcedures.length === 0} onClick={() => setAddOpen(true)}>
              <PlusIcon /> Добавить сотрудников
            </Button>
            <Button variant="destructive" disabled={selected.size === 0} onClick={removeSelected}>
              <UserMinusIcon /> Удалить сотрудников{selected.size > 0 && ` (${selected.size})`}
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    downloadParticipantsExcel(members, form.name || "Список сотрудников"),
                  )
                }
              >
                <DownloadIcon /> Скачать Excel
              </Button>
              <Button
                variant="secondary"
                disabled={pending || people.length === 0}
                onClick={() => excelInputRef.current?.click()}
              >
                <UploadIcon /> Загрузить Excel
              </Button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) importExcel(file)
                }}
              />
            </div>
          </div>
          {memberProcedures.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Нет доступных участников для добавления в команду.
            </p>
          )}

          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table className="w-full min-w-[960px] table-fixed text-xs">
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
                  <HeadCell
                    label="ФИО"
                    className="w-[18%]"
                    view={view}
                    sortKey="fullName"
                    searchKey="fullName"
                  />
                  <HeadCell
                    label="Должность"
                    className="w-[16%]"
                    view={view}
                    filterKey="position"
                    participants={members}
                  />
                  <HeadCell
                    label="Подразделение ССП"
                    className="w-[16%]"
                    view={view}
                    filterKey="sspUnit"
                    participants={members}
                  />
                  <HeadCell
                    label="Подразделение ВСП"
                    className="w-[16%]"
                    view={view}
                    filterKey="vspUnit"
                    participants={members}
                  />
                  <HeadCell label="Процедура" className="w-[12%]" />
                  <HeadCell label="Персональный отчёт" className="w-28 text-center" />
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
                {pageRows.map((p) => {
                  const hasReport = p.reportAccess !== null
                  return (
                    <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                      <TableCell className="w-10">
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
                      <TableCell className="w-12">
                        <ParticipantAvatar fullName={p.fullName} />
                      </TableCell>
                      <TableCell className="whitespace-normal">{p.fullName}</TableCell>
                      <TableCell className="whitespace-normal"><Cell>{p.position}</Cell></TableCell>
                      <TableCell className="whitespace-normal"><Cell>{p.sspUnit}</Cell></TableCell>
                      <TableCell className="whitespace-normal"><Cell>{p.vspUnit}</Cell></TableCell>
                      <TableCell className="whitespace-normal">
                        <Cell>{procedureNameById.get(p.procedureId) ?? "—"}</Cell>
                      </TableCell>
                      <TableCell className="w-28 text-center">
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          disabled={!hasReport}
                          className={cn(hasReport && "text-primary")}
                          aria-label={`Персональный отчёт: ${p.fullName}`}
                          onClick={() => setPersonalReport(p)}
                        >
                          <FileTextIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {view.rows.length > 0 && (
            <SimplePagination
              total={view.rows.length}
              page={currentMembersPage}
              pageCount={membersPageCount}
              onPageChange={setMembersPage}
            />
          )}
          {show("members") && <p className="text-xs text-destructive">{show("members")}</p>}
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
        procedures={memberProcedures}
        initialProcedureId={procedureId || undefined}
        onAdd={({ procedureId: fromProcedureId, memberIds: ids, groups: newGroups }) => {
          const pool = procedures.find((p) => p.id === fromProcedureId)
          const inProcedure = new Set(pool?.participants.map((p) => p.id) ?? [])
          setForm((f) => {
            const keptMembers = f.memberIds.filter((id) => inProcedure.has(id) && !ids.includes(id))
            const memberIds = [...keptMembers, ...ids]
            const keptGroups =
              f.procedureId === fromProcedureId
                ? f.groups
                    .map((g) => ({
                      ...g,
                      memberIds: g.memberIds.filter((id) => memberIds.includes(id)),
                    }))
                    .filter((g) => g.memberIds.length > 0)
                : []
            return {
              ...f,
              procedureId: fromProcedureId,
              memberIds,
              leaderIds: f.leaderIds.filter((id) => inProcedure.has(id)),
              groups: [...keptGroups, ...newGroups],
            }
          })
          setSelected(new Set())
          setAddOpen(false)
          toast.success(
            `Добавлено ${ids.length} ${pluralRu(ids.length, "участник", "участника", "участников")}` +
              (newGroups.length
                ? ` · ${newGroups.length} ${pluralRu(newGroups.length, "группа", "группы", "групп")}`
                : ""),
          )
        }}
      />
      <ReportDialog
        participant={personalReport}
        procedureName={
          personalReport
            ? (procedureNameById.get(personalReport.procedureId) ?? "—")
            : ""
        }
        onOpenChange={(open) => !open && setPersonalReport(null)}
      />
    </div>
  )
}

function AccessControls({
  label,
  access,
  emailSent,
  pending,
  onToggle,
}: {
  label: string
  access: Exclude<ReportAccess, null>
  emailSent: boolean
  pending: boolean
  onToggle: (sendEmail: boolean) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const closing = access === "open"
  const actionLabel = closing ? "Закрыть доступ" : "Открыть доступ"

  return (
    <>
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
            <span className="font-semibold">{label}:</span> <AccessStatus access={access} />
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setSendEmail(true)
              setConfirmOpen(true)
            }}
          >
            {closing ? <LockIcon /> : <LockOpenIcon />}
            {actionLabel}
          </Button>
        </div>
        <EmailSentStatus sent={emailSent} />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              {closing
                ? `${label} будет закрыт. Получатели больше не смогут открыть отчёт.`
                : `${label} будет открыт. Получатели смогут просматривать отчёт.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!closing && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(Boolean(v))} />
              Отправить письмо на электронную почту
            </label>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant={closing ? "destructive" : "default"}
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false)
                onToggle(closing ? false : sendEmail)
              }}
            >
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string
  label: string
  error?: string | null
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        {required && <span className="text-destructive">*</span>}
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
