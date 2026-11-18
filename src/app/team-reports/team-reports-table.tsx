"use client"

import Link from "next/link"
import { SimplePagination } from "@/components/simple-pagination"
import { TeamReportStatusBadge } from "@/components/status-badge"
import { SortableColumns } from "@/components/sortable-columns"
import { usePagedSort } from "@/components/use-paged-sort"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AccessStatus } from "@/app/procedures/_components/access-status"
import { formatDateTime } from "@/lib/format"
import type { TeamReportSummary } from "@/lib/types"

const PAGE_SIZE = 10

type SortKey = "name" | "leaderName" | "hrbpName" | "memberCount"

const COLUMNS: Array<{
  label: string
  /** Две строки шапки — длинные названия не раздувают столбец. */
  lines?: [string, string]
  sort?: SortKey
  className?: string
}> = [
  { label: "Название", sort: "name", className: "w-[15%]" },
  { label: "Статус", className: "w-[10%]" },
  {
    label: "Количество сотрудников",
    lines: ["Количество", "сотрудников"],
    sort: "memberCount",
    className: "w-[13%]",
  },
  { label: "Руководитель", sort: "leaderName", className: "w-[14%]" },
  { label: "Доступ для руководителя", lines: ["Доступ для", "руководителя"], className: "w-[11%]" },
  { label: "Сотрудник ДРП", sort: "hrbpName", className: "w-[15%]" },
  {
    label: "Доступ для сотрудника ДРП",
    lines: ["Доступ для", "сотрудника ДРП"],
    className: "w-[13%]",
  },
  { label: "Создатель отчёта", lines: ["Создатель", "отчёта"], className: "w-[9%]" },
]

export function TeamReportsTable({ reports }: { reports: TeamReportSummary[] }) {
  const { sort, rows, page, pageCount, setPage, sortBy } = usePagedSort<TeamReportSummary, SortKey>(
    reports,
    PAGE_SIZE,
  )

  return (
    <div className="p-4 pt-3">
      <div className="rounded-lg">
        <Table className="table-fixed text-xs">
          <TableHeader className="bg-table-head">
            <SortableColumns
              columns={COLUMNS}
              sort={sort}
              onSort={sortBy}
              headClassName="h-auto whitespace-normal py-2 align-bottom font-semibold leading-tight text-foreground"
              clusterClassName="inline-flex items-end gap-1"
            />
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
                <TableCell className="whitespace-normal">
                  <Link href={`/team-reports/${r.id}`} className="font-medium text-primary hover:underline">
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <TeamReportStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="whitespace-normal tabular-nums">{r.memberCount}</TableCell>
                <TableCell className="whitespace-normal">{r.leaderName}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <AccessStatus access={r.reportAccess} />
                </TableCell>
                <TableCell className="whitespace-normal">{r.hrbpName}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <AccessStatus access={r.hrbpReportAccess} />
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  <span className="block tabular-nums leading-4">{formatDateTime(r.updatedAt)}</span>
                  <span className="block leading-4">{r.creator}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <SimplePagination total={reports.length} page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  )
}
