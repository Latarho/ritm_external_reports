import type { ReportParticipant } from "@/lib/report/types"
import { cn } from "@/lib/utils"

/** Номер участника в кружке: участники команды — синие, руководитель — зелёный. */
export function Chip({
  participant,
  size = "md",
}: {
  participant: ReportParticipant
  size?: "sm" | "md"
}) {
  const leader = participant.group === "leader"
  const label = `${participant.number}. ${participant.fullName}${leader ? " — руководитель" : ""}`
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
        size === "sm" ? "size-5 text-[10px]" : "size-7 text-xs",
        leader
          ? "bg-success text-white ring-2 ring-success/30"
          : "bg-primary/20 text-primary ring-1 ring-primary/40",
      )}
    >
      {participant.number}
    </span>
  )
}

export function ChipList({
  participants,
  size,
  className,
}: {
  participants: ReportParticipant[]
  size?: "sm" | "md"
  className?: string
}) {
  if (participants.length === 0) return null
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {participants.map((p) => (
        <Chip key={p.id} participant={p} size={size} />
      ))}
    </div>
  )
}

export function ReportSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-20 rounded-xl bg-background shadow-xs break-inside-avoid-page", className)}
    >
      <div className="border-b px-4 py-3">
        <h2 id={`${id}-title`} className="text-base font-semibold">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-4xl text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Блок «Описание отчёта» с пояснениями к визуализации. */
export function Explanation({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg bg-muted/70 p-4 text-xs leading-relaxed text-foreground/80">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        Описание отчёта
      </p>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

export function GroupLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-primary/20 ring-1 ring-primary/40" /> Участник команды
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-success ring-2 ring-success/30" /> Руководитель
      </span>
      <span>Наведите на номер, чтобы увидеть ФИО</span>
    </div>
  )
}
