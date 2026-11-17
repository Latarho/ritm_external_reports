import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeamReportNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-background p-10 text-center shadow-xs">
      <h1 className="text-base font-semibold">Командный отчёт не найден</h1>
      <p className="text-sm text-muted-foreground">Возможно, он был удалён вместе с процедурой.</p>
      <Button render={<Link href="/team-reports" />} nativeButton={false}>
        К списку командных отчётов
      </Button>
    </div>
  )
}
