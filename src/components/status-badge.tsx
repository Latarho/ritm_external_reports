import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ProcedureStatus } from "@/lib/types"

const STYLES: Record<ProcedureStatus, string> = {
  draft: "bg-muted text-foreground/80",
  in_progress: "bg-accent text-primary",
  completed: "bg-success/10 text-success",
}

export function StatusBadge({ status }: { status: ProcedureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold tracking-wide uppercase",
        STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
