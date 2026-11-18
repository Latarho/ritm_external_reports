"use client"

import { useMemo, useState } from "react"
import { compareValues, nextSort, type SortDir } from "@/components/sort-button"

/** Сортировка и постраничный срез списка. Смена сортировки возвращает на первую страницу. */
export function usePagedSort<T, K extends Extract<keyof T, string>>(items: T[], pageSize: number) {
  const [sort, setSort] = useState<{ key: K; dir: SortDir } | null>(null)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return items
    const factor = sort.dir === "asc" ? 1 : -1
    return [...items].sort((a, b) => factor * compareValues(a[sort.key], b[sort.key]))
  }, [items, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount)
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize)

  function sortBy(key: K) {
    setSort((currentSort) => nextSort<K>(currentSort, key))
    setPage(1)
  }

  return { sort, rows, page: current, pageCount, setPage, sortBy }
}
