"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { DownloadIcon, FileTextIcon, InfoIcon, LockIcon, LockOpenIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { ColumnFilter } from "@/components/column-filters"
import { ParticipantAvatar } from "@/components/participant-avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { pluralRu } from "@/lib/format"
import type { Participant, ReportAccess } from "@/lib/types"
import { cn } from "@/lib/utils"
import { setReportAccessAction } from "../actions"
import { AccessStatus } from "./access-status"
import { downloadParticipantsExcel } from "./excel"
import { ReportDialog } from "./report-dialog"
import { Cell, EmptyState, HeadCell } from "./table-bits"
import { useParticipantView } from "./use-participant-view"

type Tab = "all" | "open" | "closed"

/** Список сотрудников запущенной процедуры: просмотр и управление доступом к отчётам. */
export function LaunchedParticipants({
  procedureId,
  procedureName,
  participants,
}: {
  procedureId: string
  procedureName: string
  participants: Participant[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [report, setReport] = useState<Participant | null>(null)
  const [pending, startTransition] = useTransition()

  const inTab = tab === "all" ? participants : participants.filter((p) => p.reportAccess === tab)
  const view = useParticipantView(inTab)

  const counts = {
    all: participants.length,
    open: participants.filter((p) => p.reportAccess === "open").length,
    closed: participants.filter((p) => p.reportAccess === "closed").length,
  }

  const selectable = view.rows.filter((p) => p.reportAccess !== null)
  const selectableIds = selectable.map((p) => p.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))
  const someSelected = selectableIds.some((id) => selected.has(id))

  function setAccess(ids: string[], access: Exclude<ReportAccess, null>) {
    startTransition(async () => {
      const res = await setReportAccessAction(procedureId, ids, access)
      if (!res.ok) return void toast.error(res.error)
      const n = res.data.changed
      toast.success(
        n === 0
          ? "Доступ уже был в нужном состоянии"
          : `Доступ ${access === "open" ? "открыт" : "закрыт"}: ${n} ${pluralRu(n, "сотрудник", "сотрудника", "сотрудников")}`,
      )
      setSelected(new Set())
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as Tab)
            setSelected(new Set())
          }}
        >
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="px-3 text-xs data-active:bg-foreground/80 data-active:text-background">
              Все · {counts.all}
            </TabsTrigger>
            <TabsTrigger value="open" className="px-3 text-xs data-active:bg-foreground/80 data-active:text-background">
              Открыт · {counts.open}
            </TabsTrigger>
            <TabsTrigger value="closed" className="px-3 text-xs data-active:bg-foreground/80 data-active:text-background">
              Закрыт · {counts.closed}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent px-2 py-1 text-xs">
            <span className="px-1 font-medium">
              Выбрано: {selected.size}
            </span>
            <Button size="sm" disabled={pending} onClick={() => setAccess([...selected], "open")}>
              <LockOpenIcon /> Открыть доступ
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setAccess([...selected], "closed")}>
              <LockIcon /> Закрыть доступ
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Снять выбор" onClick={() => setSelected(new Set())}>
              <XIcon />
            </Button>
          </div>
        )}
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">
        Выберите сотрудников, чтобы изменить доступ к отчётам сразу для нескольких.
      </p>

      <div className="max-h-[60vh] overflow-auto rounded-lg border">
        <Table className="min-w-[1250px] text-xs">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <HeadCell
                className="w-10"
                label={
                  <Checkbox
                    aria-label="Выбрать всех"
                    disabled={selectableIds.length === 0}
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onCheckedChange={(checked) => {
                      const next = new Set(selected)
                      for (const id of selectableIds) {
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
              <HeadCell label="Должность" view={view} filterKey="position" participants={inTab} />
              <HeadCell label="Подразделение ССП" view={view} filterKey="sspUnit" participants={inTab} />
              <HeadCell label="Подразделение ВСП" view={view} filterKey="vspUnit" participants={inTab} />
              <HeadCell label="Внешний логин" view={view} searchKey="externalLogin" />
              <HeadCell label="Внешняя ссылка" view={view} sortKey="externalLink" />
              <HeadCell
                className="w-48"
                label={
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    Доступ к отчётам
                    <Tooltip>
                      <TooltipTrigger
                        render={<span tabIndex={0} aria-label="Подсказка" className="inline-flex text-primary" />}
                      >
                        <InfoIcon className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        Открытый доступ позволяет сотруднику посмотреть свой отчёт по результатам внешней оценки.
                      </TooltipContent>
                    </Tooltip>
                    <ColumnFilter
                      label="Доступ к отчётам"
                      options={[
                        { value: "open", label: "Открыт" },
                        { value: "closed", label: "Закрыт" },
                        { value: "none", label: "Нет ссылки" },
                      ]}
                      selected={view.filters.reportAccess}
                      onChange={(v) => view.setFilter("reportAccess", v)}
                    />
                  </span>
                }
              />
              <HeadCell label="Отчёт" className="w-14 text-center" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10}>
                  <EmptyState filtered={view.isFiltered} onReset={view.reset} />
                </TableCell>
              </TableRow>
            )}
            {view.rows.map((p) => {
              const hasAccess = p.reportAccess !== null
              return (
                <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Выбрать ${p.fullName}`}
                      disabled={!hasAccess}
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
                  <TableCell className="max-w-64 break-all whitespace-normal">
                    <Cell>{p.externalLink}</Cell>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between gap-2">
                      <AccessStatus access={p.reportAccess} />
                      {hasAccess && (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-primary hover:underline disabled:opacity-50"
                          onClick={() => setAccess([p.id], p.reportAccess === "open" ? "closed" : "open")}
                        >
                          {p.reportAccess === "open" ? "Закрыть" : "Открыть"}
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      disabled={!hasAccess}
                      className={cn(hasAccess && "text-primary")}
                      aria-label={`Отчёт: ${p.fullName}`}
                      onClick={() => setReport(p)}
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

      <ReportDialog
        participant={report}
        procedureName={procedureName}
        onOpenChange={(open) => !open && setReport(null)}
      />
    </div>
  )
}

export function DownloadExcelButton({
  participants,
  name,
}: {
  participants: Participant[]
  name: string
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="secondary"
      disabled={pending || participants.length === 0}
      onClick={() => startTransition(() => downloadParticipantsExcel(participants, name))}
    >
      <DownloadIcon /> Скачать Excel
    </Button>
  )
}
