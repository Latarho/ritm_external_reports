import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { PlusIcon, UsersRoundIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listProcedures } from "@/lib/store"
import { ProceduresTable } from "./procedures-table"

export default function ProceduresPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-background px-3 text-xs font-medium shadow-xs">
          <UsersRoundIcon className="size-4 text-primary" />
          Процедуры
        </span>
      </div>
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
