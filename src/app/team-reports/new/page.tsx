import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { listLaunchedProcedures } from "@/lib/store"
import { TeamReportEditor } from "../_components/team-report-editor"
import { EditorFallback } from "../_components/editor-fallback"

export const metadata: Metadata = { title: "Новый командный отчёт · Внешняя оценка" }

export default function NewTeamReportPage() {
  return (
    <Suspense fallback={<EditorFallback />}>
      <NewTeamReportData />
    </Suspense>
  )
}

async function NewTeamReportData() {
  await connection()
  const procedures = await listLaunchedProcedures()
  return <TeamReportEditor report={null} procedures={procedures} />
}
