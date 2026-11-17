import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { SectionTabs } from "@/components/section-tabs"
import { Button } from "@/components/ui/button"
import { listTeamReports } from "@/lib/store"
import { TeamReportsTable } from "./team-reports-table"

export const metadata: Metadata = { title: "Командные отчёты · Внешняя оценка" }

export default function TeamReportsPage() {
  return (
    <div className="flex flex-col gap-3">
      <SectionTabs active="team-reports" />
      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">Список командных отчётов</h1>
          <Button render={<Link href="/team-reports/new" />} nativeButton={false}>
            <PlusIcon /> Создать
          </Button>
        </div>
        <Suspense fallback={<TableFallback />}>
          <TeamReportsData />
        </Suspense>
      </section>
    </div>
  )
}

async function TeamReportsData() {
  await connection()
  const reports = await listTeamReports()
  return <TeamReportsTable reports={reports} />
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
