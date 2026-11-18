import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { PlusIcon } from "lucide-react"
import { SectionTabs, type Section } from "@/components/section-tabs"
import { Button } from "@/components/ui/button"

/** Карточка списка: вкладки раздела, заголовок, кнопка «Создать» и таблица. */
export function ListSection({
  section,
  title,
  createHref,
  children,
}: {
  section: Section
  title: string
  createHref: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTabs active={section} />
      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">{title}</h1>
          <Button render={<Link href={createHref} />} nativeButton={false}>
            <PlusIcon /> Создать
          </Button>
        </div>
        <Suspense fallback={<TableFallback />}>{children}</Suspense>
      </section>
    </div>
  )
}

export function TableFallback() {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}
