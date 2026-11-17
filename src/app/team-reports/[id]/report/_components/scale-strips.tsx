import type { ScaleSection } from "@/lib/report/definitions"
import type { ReportParticipant } from "@/lib/report/types"
import { ChipList } from "./primitives"

const TICKS = Array.from({ length: 11 }, (_, i) => i)

/** Шкалы 0–10: где на шкале находится каждый участник и среднее по группе. */
export function ScaleStrips({
  section,
  participants,
}: {
  section: ScaleSection
  participants: ReportParticipant[]
}) {
  return (
    <div className="grid grid-cols-1 gap-5">
      {section.groups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-3 rounded-md bg-muted px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {group.title}
          </h3>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] gap-4">
              {group.scales.map((scale) => {
                const values = participants.map((p) => p.results.scales[scale.key])
                const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
                return (
                  <div key={scale.key} className="grid grid-cols-[180px_1fr] items-start gap-4">
                    <div className="pt-4 text-xs">
                      {scale.code && <span className="block text-muted-foreground">Шкала {scale.code}</span>}
                      <span className="font-medium">{scale.name}</span>
                    </div>
                    <div>
                      <div className="relative h-4">
                        <span
                          className="absolute -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap text-primary"
                          style={{ left: `${((avg + 0.5) / 11) * 100}%` }}
                          title={`Среднее: ${avg.toFixed(2)}`}
                        >
                          ▼ ср. {avg.toFixed(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-11 rounded-full bg-primary/15 text-center text-[10px] font-medium text-primary">
                        {TICKS.map((t) => (
                          <span key={t} className="py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 grid grid-cols-11">
                        {TICKS.map((t) => (
                          <ChipList
                            key={t}
                            size="sm"
                            className="justify-center"
                            participants={participants.filter((p) => p.results.scales[scale.key] === t)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
