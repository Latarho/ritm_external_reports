"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "lucide-react"
import { ProcedureActionsMenu } from "@/components/procedure-actions-menu"
import { SortButton, compareValues, nextSort, type SortDir } from "@/components/sort-button"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/format"
import type { ProcedureSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

type SortKey = "name" | "participantCount" | "startDate" | "endDate" | "updatedAt"

const COLUMNS: Array<{ label: string; sort?: SortKey; className?: string }> = [
  { label: "Название", sort: "name", className: "w-[16%]" },
  { label: "Тип процедуры" },
  { label: "Количество людей", sort: "participantCount" },
  { label: "Статус" },
  { label: "Дата начала", sort: "startDate" },
  { label: "Дата окончания", sort: "endDate" },
  { label: "Создатель процедуры" },
  { label: "Последнее изменение", sort: "updatedAt" },
  { label: "Действие", className: "w-24 text-center" },
]

export function ProceduresTable({ procedures }: { procedures: ProcedureSummary[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return procedures
    const factor = sort.dir === "asc" ? 1 : -1
    return [...procedures].sort((a, b) => factor * compareValues(a[sort.key], b[sort.key]))
  }, [procedures, sort])

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
                  Процедур пока нет. Нажмите «Создать», чтобы добавить первую.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-56 whitespace-normal">
                  <Link href={`/procedures/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.type}</TableCell>
                <TableCell className="tabular-nums">{p.participantCount}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="tabular-nums">{formatDate(p.startDate)}</TableCell>
                <TableCell className="tabular-nums">{formatDate(p.endDate)}</TableCell>
                <TableCell>{p.creator}</TableCell>
                <TableCell className="tabular-nums">{formatDate(p.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            className="text-primary"
                            render={<Link href={`/procedures/${p.id}`} />}
                            nativeButton={false}
                            aria-label={`Редактировать «${p.name}»`}
                          />
                        }
                      >
                        <PencilIcon />
                      </TooltipTrigger>
                      <TooltipContent>
                        {p.status === "draft" ? "Редактировать" : "Открыть"}
                      </TooltipContent>
                    </Tooltip>
                    <ProcedureActionsMenu id={p.id} name={p.name} status={p.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs">
        <span className="text-muted-foreground">Всего {procedures.length}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Предыдущая страница"
          disabled={current <= 1}
          onClick={() => setPage(current - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            size="icon-sm"
            variant={n === current ? "default" : "ghost"}
            className={n === current ? "bg-foreground/80 hover:bg-foreground/70" : undefined}
            aria-current={n === current ? "page" : undefined}
            onClick={() => setPage(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Следующая страница"
          disabled={current >= pageCount}
          onClick={() => setPage(current + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
