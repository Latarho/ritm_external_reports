"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SimplePagination } from "@/components/simple-pagination"
import { SortButton, compareValues, nextSort, type SortDir } from "@/components/sort-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ACCESS_LABELS } from "@/app/procedures/_components/access-status"
import { formatLastChange } from "@/lib/format"
import type { ReportAccess, TeamReportSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  setTeamReportAccessAction,
  type TeamReportAccessAudience,
} from "./actions"
import { EmailSentStatus } from "./_components/email-sent-status"

const PAGE_SIZE = 10

type SortKey = "name" | "leaderName" | "hrbpName" | "memberCount" | "updatedAt"

const ACCESS_ITEMS = [
  { value: "open", label: ACCESS_LABELS.open },
  { value: "closed", label: ACCESS_LABELS.closed },
] as const

const COLUMNS: Array<{ label: string; sort?: SortKey; className?: string }> = [
  { label: "Название", sort: "name", className: "w-[18%]" },
  { label: "Количество сотрудников", sort: "memberCount" },
  { label: "Руководитель", sort: "leaderName" },
  { label: "Доступ для руководителя" },
  { label: "Сотрудник ДРП", sort: "hrbpName" },
  { label: "Доступ для сотрудника ДРП" },
  { label: "Создатель отчёта" },
  { label: "Последнее изменение", sort: "updatedAt" },
]

export function TeamReportsTable({ reports }: { reports: TeamReportSummary[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return reports
    const factor = sort.dir === "asc" ? 1 : -1
    return [...reports].sort((a, b) => factor * compareValues(a[sort.key], b[sort.key]))
  }, [reports, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div className="p-4 pt-3">
      <div className="overflow-x-auto rounded-lg">
        <Table className="min-w-[1100px] text-xs">
          <TableHeader className="bg-table-head">
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((col) => (
                <TableHead key={col.label} className={cn("h-9 font-semibold text-foreground", col.className)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sort && (
                      <SortButton
                        label={col.label}
                        dir={sort?.key === col.sort ? sort.dir : null}
                        onClick={() => {
                          setSort((s) => nextSort(s, col.sort!))
                          setPage(1)
                        }}
                      />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="h-24 text-center text-muted-foreground">
                  Командных отчётов пока нет. Нажмите «Создать», чтобы собрать команду из участников
                  запущенной процедуры.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-60 whitespace-normal">
                  <Link href={`/team-reports/${r.id}`} className="font-medium text-primary hover:underline">
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{r.memberCount}</TableCell>
                <TableCell className="max-w-44 whitespace-normal">{r.leaderName}</TableCell>
                <TableCell>
                  <AccessSelect
                    reportId={r.id}
                    access={r.reportAccess}
                    emailSent={r.reportEmailSent}
                    audience="leader"
                    label="Доступ для руководителя"
                  />
                </TableCell>
                <TableCell className="max-w-44 whitespace-normal">{r.hrbpName}</TableCell>
                <TableCell>
                  <AccessSelect
                    reportId={r.id}
                    access={r.hrbpReportAccess}
                    emailSent={r.hrbpEmailSent}
                    audience="hrbp"
                    label="Доступ для сотрудника ДРП"
                  />
                </TableCell>
                <TableCell>{r.creator}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatLastChange(r.updatedAt, r.updatedBy)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <SimplePagination total={reports.length} page={current} pageCount={pageCount} onPageChange={setPage} />
    </div>
  )
}

function AccessSelect({
  reportId,
  access,
  emailSent,
  audience,
  label,
}: {
  reportId: string
  access: Exclude<ReportAccess, null>
  emailSent: boolean
  audience: TeamReportAccessAudience
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pendingAccess, setPendingAccess] = useState<Exclude<ReportAccess, null> | null>(null)
  const [sendEmail, setSendEmail] = useState(true)

  function apply(next: Exclude<ReportAccess, null>, withEmail: boolean) {
    startTransition(async () => {
      const res = await setTeamReportAccessAction(reportId, next, audience, {
        sendEmail: withEmail,
      })
      setPendingAccess(null)
      if (!res.ok) return void toast.error(res.error)
      const opened = next === "open"
      toast.success(
        audience === "hrbp"
          ? opened
            ? withEmail
              ? "Доступ сотрудника ДРП открыт, письмо отправлено"
              : "Доступ сотрудника ДРП открыт"
            : "Доступ сотрудника ДРП закрыт"
          : opened
            ? withEmail
              ? "Доступ руководителю открыт, письмо отправлено"
              : "Доступ руководителю открыт"
            : "Доступ руководителю закрыт",
      )
      router.refresh()
    })
  }

  const nextAccess = pendingAccess
  const closing = nextAccess === "closed"
  const actionLabel = closing ? "Закрыть доступ" : "Открыть доступ"

  return (
    <>
      <div className="flex flex-col gap-1">
        <Select
          items={[...ACCESS_ITEMS]}
          value={access}
          disabled={pending}
          onValueChange={(value) => {
            if (value !== "open" && value !== "closed") return
            if (value === access) return
            setSendEmail(true)
            setPendingAccess(value)
          }}
        >
          <SelectTrigger size="sm" className="h-7 min-w-28 text-xs" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <EmailSentStatus sent={emailSent} />
      </div>

      <AlertDialog
        open={pendingAccess !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setPendingAccess(null)
        }}
      >
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
              disabled={pending || !nextAccess}
              onClick={() => {
                if (!nextAccess) return
                apply(nextAccess, closing ? false : sendEmail)
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
