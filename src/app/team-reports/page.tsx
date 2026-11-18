import type { Metadata } from "next"
import { connection } from "next/server"
import { ListSection } from "@/components/list-section"
import { listTeamReports } from "@/lib/store"
import { TeamReportsTable } from "./team-reports-table"

export const metadata: Metadata = { title: "Командные отчёты · Внешняя оценка" }

export default function TeamReportsPage() {
  return (
    <ListSection
      section="team-reports"
      title="Список командных отчётов"
      createHref="/team-reports/new"
    >
      <TeamReportsData />
    </ListSection>
  )
}

async function TeamReportsData() {
  await connection()
  const reports = await listTeamReports()
  return <TeamReportsTable reports={reports} />
}
