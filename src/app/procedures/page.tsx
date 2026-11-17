import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { SectionTabs } from "@/components/section-tabs"
import { Button } from "@/components/ui/button"
import { listProcedures } from "@/lib/store"
import { ProceduresTable } from "./procedures-table"

export default function ProceduresPage() {
  return (
    <div className="flex flex-col gap-3">
      <SectionTabs active="procedures" />
      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">Список процедур</h1>
          <Button render={<Link href="/procedures/new" />} nativeButton={false}>
            <PlusIcon /> Создать
          </Button>
        </div>
        <Suspense fallback={<TableFallback />}>
          <ProceduresData />
        </Suspense>
      </section>
    </div>
  )
}

async function ProceduresData() {
  await connection()
  const procedures = await listProcedures()
  return <ProceduresTable procedures={procedures} />
}

function TableFallback() {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}
