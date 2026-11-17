"use client"

import { InboxIcon } from "lucide-react"
import { ColumnFilter, ColumnSearch, uniqueOptions } from "@/components/column-filters"
import { SortButton } from "@/components/sort-button"
import { Button } from "@/components/ui/button"
import { TableHead } from "@/components/ui/table"
import type { Participant } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ListFilterKey, ParticipantView, SearchKey, SortKey } from "./use-participant-view"

export function HeadCell({
  label,
  className,
  view,
  sortKey,
  searchKey,
  filterKey,
  participants,
}: {
  label: React.ReactNode
  className?: string
  view?: ParticipantView
  sortKey?: SortKey
  searchKey?: SearchKey
  filterKey?: Exclude<ListFilterKey, "reportAccess">
  participants?: Participant[]
}) {
  const text = typeof label === "string" ? label : ""
  return (
    <TableHead className={cn("h-10 bg-table-head text-xs font-semibold whitespace-normal text-foreground", className)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {view && sortKey && (
          <SortButton
            label={text}
            dir={view.sort?.key === sortKey ? view.sort.dir : null}
            onClick={() => view.toggleSort(sortKey)}
          />
        )}
        {view && searchKey && (
          <ColumnSearch
            label={text}
            value={view.search[searchKey]}
            onChange={(v) => view.setSearch(searchKey, v)}
          />
        )}
        {view && filterKey && participants && (
          <ColumnFilter
            label={text}
            options={uniqueOptions(participants.map((p) => p[filterKey]))}
            selected={view.filters[filterKey]}
            onChange={(v) => view.setFilter(filterKey, v)}
          />
        )}
      </span>
    </TableHead>
  )
}

export function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-xs text-muted-foreground">
      <InboxIcon className="size-10 text-primary/70" strokeWidth={1.5} />
      {filtered ? (
        <>
          Нет сотрудников, подходящих под фильтры
          <Button variant="link" size="sm" onClick={onReset}>
            Сбросить фильтры
          </Button>
        </>
      ) : (
        "Нет данных"
      )}
    </div>
  )
}

export function Cell({ children }: { children: React.ReactNode }) {
  return <>{children === "" || children == null ? <span className="text-muted-foreground">—</span> : children}</>
}
