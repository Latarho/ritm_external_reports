"use client"

import Link from "next/link"
import { PencilIcon } from "lucide-react"
import { ProcedureActionsMenu } from "@/components/procedure-actions-menu"
import { SimplePagination } from "@/components/simple-pagination"
import { SortableColumns } from "@/components/sortable-columns"
import { usePagedSort } from "@/components/use-paged-sort"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/format"
import type { ProcedureSummary } from "@/lib/types"

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
  const { sort, rows, page, pageCount, setPage, sortBy } = usePagedSort<ProcedureSummary, SortKey>(
    procedures,
    PAGE_SIZE,
  )

  return (
    <div className="p-4 pt-3">
      <div className="overflow-x-auto rounded-lg">
        <Table className="min-w-[1100px] text-xs">
          <TableHeader className="bg-table-head">
            <SortableColumns
              columns={COLUMNS}
              sort={sort}
              onSort={sortBy}
              headClassName="h-9 font-semibold text-foreground"
              clusterClassName="inline-flex items-center gap-1"
            />
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

      <SimplePagination
        total={procedures.length}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      />
    </div>
  )
}
