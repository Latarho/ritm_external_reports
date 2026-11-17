import { INTEGRAL_TEXT } from "@/lib/report/definitions"
import type { IntegralPoint } from "@/lib/report/types"
import { cn } from "@/lib/utils"
import { Explanation } from "./primitives"

type Zone = "resource" | "limit" | "neutral"

function zone(p: IntegralPoint): Zone {
  if (p.consistency < 50) return "neutral"
  return p.manifestation >= 50 ? "resource" : "limit"
}

const ZONE_STYLE: Record<Zone, string> = {
  resource: "bg-success text-white",
  limit: "bg-destructive text-white",
  neutral: "bg-primary text-primary-foreground",
}

/** Матрица «проявленность × согласованность» по компетенциям. */
export function IntegralMatrix({ points }: { points: IntegralPoint[] }) {
  const sorted = [...points].sort((a, b) => b.manifestation - a.manifestation)
  const numbered = sorted.map((p, i) => ({ ...p, n: i + 1 }))

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
        <figure className="grid grid-cols-[auto_1fr] gap-2">
          <div className="flex items-center justify-center">
            <span className="text-[11px] whitespace-nowrap text-muted-foreground [writing-mode:vertical-rl] rotate-180">
              Проявленность компетенций в сравнении с рынком →
            </span>
          </div>
          <div>
            <div
              className="relative aspect-square w-full overflow-hidden rounded-lg border"
              role="img"
              aria-label="Матрица компетенций: по горизонтали согласованность, по вертикали проявленность"
            >
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-r border-b bg-background" />
                <div className="border-b bg-success/12" />
                <div className="border-r bg-background" />
                <div className="bg-destructive/10" />
              </div>
              <span className="absolute top-2 right-2 text-[10px] text-success">Ресурсы группы</span>
              <span className="absolute right-2 bottom-2 text-[10px] text-destructive">Ограничения группы</span>
              <span className="absolute top-2 left-2 text-[10px] text-muted-foreground">Высокая проявленность</span>
              <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">Низкая проявленность</span>
              {numbered.map((p) => (
                <span
                  key={p.competency}
                  title={`${p.competency}: проявленность ${p.manifestation}%, согласованность ${p.consistency}%`}
                  className={cn(
                    "absolute flex size-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold shadow-sm ring-2 ring-background",
                    ZONE_STYLE[zone(p)],
                  )}
                  style={{
                    left: `${Math.min(96, Math.max(4, p.consistency))}%`,
                    bottom: `${Math.min(96, Math.max(4, p.manifestation))}%`,
                  }}
                >
                  {p.n}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>Низкая согласованность</span>
              <span>Согласованность ответов участников →</span>
              <span>Высокая</span>
            </div>
          </div>
        </figure>

        <ol className="grid content-start gap-1 text-xs">
          {numbered.map((p) => (
            <li key={p.competency} className="flex items-center gap-2 rounded-md px-2 py-1.5 odd:bg-muted/50">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  ZONE_STYLE[zone(p)],
                )}
              >
                {p.n}
              </span>
              <span className="flex-1">{p.competency}</span>
              <span className="font-semibold tabular-nums">{p.manifestation}%</span>
              <span className="w-28 text-right text-muted-foreground tabular-nums">
                согласов. {p.consistency}%
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Explanation>
        <p>{INTEGRAL_TEXT.intro}</p>
        <ul className="list-disc pl-4">
          {INTEGRAL_TEXT.axes.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p>{INTEGRAL_TEXT.strong}</p>
        <p>{INTEGRAL_TEXT.weak}</p>
      </Explanation>
    </>
  )
}
