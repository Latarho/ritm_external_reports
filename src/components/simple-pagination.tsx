"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SimplePagination({
  total,
  page,
  pageCount,
  onPageChange,
}: {
  total: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <span className="text-muted-foreground">Всего {total}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Предыдущая страница"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <Button
          key={n}
          size="icon-sm"
          variant={n === page ? "default" : "ghost"}
          className={n === page ? "bg-foreground/80 hover:bg-foreground/70" : undefined}
          aria-current={n === page ? "page" : undefined}
          onClick={() => onPageChange(n)}
        >
          {n}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Следующая страница"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
