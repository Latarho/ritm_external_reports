import { SortButton, type SortDir } from "@/components/sort-button"
import { TableHead, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type SortableColumn<K extends string> = {
  label: string
  lines?: [string, string]
  sort?: K
  className?: string
}

/** Строка шапки таблицы со стрелками сортировки. `lines` рисует название в две строки. */
export function SortableColumns<K extends string>({
  columns,
  sort,
  onSort,
  headClassName,
  clusterClassName,
}: {
  columns: SortableColumn<K>[]
  sort: { key: K; dir: SortDir } | null
  onSort: (key: K) => void
  headClassName: string
  clusterClassName: string
}) {
  return (
    <TableRow className="hover:bg-transparent">
      {columns.map((col) => (
        <TableHead key={col.label} className={cn(headClassName, col.className)}>
          <span className={clusterClassName}>
            {col.lines ? (
              <span className="whitespace-nowrap">
                {col.lines[0]}
                <br />
                {col.lines[1]}
              </span>
            ) : (
              col.label
            )}
            {col.sort && (
              <SortButton
                label={col.label}
                dir={sort?.key === col.sort ? sort.dir : null}
                onClick={() => onSort(col.sort!)}
              />
            )}
          </span>
        </TableHead>
      ))}
    </TableRow>
  )
}
