import { Fragment } from "react"
import {
  COMPETENCIES,
  TRAFFIC_LABELS,
  trafficLevel,
  type TrafficLevel,
} from "@/lib/report/definitions"
import type { ReportParticipant } from "@/lib/report/types"
import { cn } from "@/lib/utils"
import { Chip } from "./primitives"

const LEVEL_STYLE: Record<TrafficLevel, string> = {
  weak: "bg-destructive/75",
  limited: "bg-amber-300",
  strong: "bg-success/80",
}

/** Таблица-«светофор» по компетенциям для каждого участника. */
export function CompetencyTraffic({
  participants,
  averages,
}: {
  participants: ReportParticipant[]
  averages: Record<string, number>
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[880px] items-center gap-x-1 gap-y-1 text-xs"
          style={{ gridTemplateColumns: `minmax(240px,1.8fr) repeat(${COMPETENCIES.length}, minmax(44px,1fr))` }}
        >
          <div />
          {COMPETENCIES.map((c) => (
            <div key={c} className="flex h-32 items-end justify-center pb-1">
              <span className="text-[11px] leading-tight text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                {c}
              </span>
            </div>
          ))}

          <div className="py-1.5 font-semibold">Среднее</div>
          {COMPETENCIES.map((c) => (
            <div key={c} className="text-center font-semibold tabular-nums">
              {averages[c]}%
            </div>
          ))}

          {participants.map((p) => (
            <Fragment key={p.id}>
              <div className="flex items-center gap-2 py-0.5">
                <Chip participant={p} size="sm" />
                <span className="truncate">{p.fullName}</span>
              </div>
              {COMPETENCIES.map((c) => {
                const value = p.results.competencies[c]
                const level = trafficLevel(value)
                return (
                  <div
                    key={c}
                    title={`${p.fullName} — ${c}: ${value}% (${TRAFFIC_LABELS[level].toLowerCase()})`}
                    className={cn("mx-auto h-6 w-full max-w-9 rounded", LEVEL_STYLE[level])}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        {(Object.keys(TRAFFIC_LABELS) as TrafficLevel[]).map((level) => (
          <span key={level} className="inline-flex items-center gap-2">
            <span className={cn("size-4 rounded", LEVEL_STYLE[level])} />
            {TRAFFIC_LABELS[level]}
          </span>
        ))}
      </div>
    </>
  )
}
