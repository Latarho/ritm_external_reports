import type { ReportAccess } from "@/lib/types"
import { cn } from "@/lib/utils"

export const ACCESS_LABELS: Record<Exclude<ReportAccess, null>, string> = {
  open: "Открыт",
  closed: "Закрыт",
}

export function AccessStatus({ access }: { access: ReportAccess }) {
  if (!access) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          access === "open" ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      {ACCESS_LABELS[access]}
    </span>
  )
}
