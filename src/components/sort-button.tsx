import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDir = "asc" | "desc"

export function SortButton({
  label,
  dir,
  onClick,
}: {
  label: string
  dir: SortDir | null
  onClick: () => void
}) {
  const Icon = dir === "asc" ? ArrowUpIcon : dir === "desc" ? ArrowDownIcon : ChevronsUpDownIcon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Сортировать по полю «${label}»`}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground",
        dir && "text-primary",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

export function nextSort<K extends string>(
  current: { key: K; dir: SortDir } | null,
  key: K,
): { key: K; dir: SortDir } | null {
  if (!current || current.key !== key) return { key, dir: "asc" }
  if (current.dir === "asc") return { key, dir: "desc" }
  return null
}

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" })

export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return collator.compare(String(a ?? ""), String(b ?? ""))
}
