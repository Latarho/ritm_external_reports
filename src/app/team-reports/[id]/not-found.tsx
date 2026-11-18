import { NotFoundPanel } from "@/components/not-found-panel"

export default function TeamReportNotFound() {
  return (
    <NotFoundPanel
      title="Командный отчёт не найден"
      description="Возможно, он был удалён вместе с процедурой."
      href="/team-reports"
      action="К списку командных отчётов"
    />
  )
}
