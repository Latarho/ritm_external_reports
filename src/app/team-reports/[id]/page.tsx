import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getTeamReport, listLaunchedProcedures } from "@/lib/store"
import { EditorFallback } from "../_components/editor-fallback"
import { TeamReportEditor } from "../_components/team-report-editor"

export default function TeamReportPage({ params }: PageProps<"/team-reports/[id]">) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <TeamReportData params={params} />
    </Suspense>
  )
}

async function TeamReportData({ params }: Pick<PageProps<"/team-reports/[id]">, "params">) {
  const { id } = await params
  const [report, procedures] = await Promise.all([getTeamReport(id), listLaunchedProcedures()])
  if (!report) notFound()
  return <TeamReportEditor key={report.id} report={report} procedures={procedures} />
}
