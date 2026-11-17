import { POTENTIAL_TEXT, POTENTIAL_ZONES } from "@/lib/report/definitions"
import type { ReportParticipant } from "@/lib/report/types"
import { cn } from "@/lib/utils"
import { ChipList, Explanation } from "./primitives"

/** 0–100 → индекс трети 0..2 */
const third = (v: number) => (v < 100 / 3 ? 0 : v < 200 / 3 ? 1 : 2)

export function PotentialMatrix({ participants }: { participants: ReportParticipant[] }) {
  const cell = (row: number, col: number) =>
    participants.filter(
      (p) => 2 - third(p.results.potential) === row && third(p.results.managerSkills) === col,
    )

  return (
    <>
      <figure className="grid max-w-3xl grid-cols-[auto_1fr] gap-2">
        <div className="flex items-center justify-center">
          <span className="text-[11px] whitespace-nowrap text-muted-foreground [writing-mode:vertical-rl] rotate-180">
            Низко · Потенциал · Высоко
          </span>
        </div>
        <div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border">
            {POTENTIAL_ZONES.map((row, r) =>
              row.map((label, c) => {
                const green = r === 0 && c === 2
                const red = r === 2 && c === 0
                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn(
                      "flex min-h-32 flex-col justify-between border-r border-b p-2.5 [&:nth-child(3n)]:border-r-0 [&:nth-last-child(-n+3)]:border-b-0",
                      green && "bg-success/12",
                      red && "bg-destructive/10",
                    )}
                  >
                    <ChipList participants={cell(r, c)} />
                    <span
                      className={cn(
                        "mt-2 text-[11px] text-muted-foreground",
                        green && "font-medium text-success",
                        red && "font-medium text-destructive",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                )
              }),
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>Низко</span>
            <span>Менеджерские навыки →</span>
            <span>Высоко</span>
          </div>
        </div>
      </figure>

      <Explanation>
        <p>{POTENTIAL_TEXT.intro}</p>
        <ul className="list-disc pl-4">
          {POTENTIAL_TEXT.axes.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p>{POTENTIAL_TEXT.strong}</p>
        <p>{POTENTIAL_TEXT.weak}</p>
      </Explanation>
    </>
  )
}
