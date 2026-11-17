import { LEARNING_AXES, LEARNING_GRID } from "@/lib/report/definitions"
import type { ReportParticipant } from "@/lib/report/types"
import { ChipList } from "./primitives"

export function LearningStyles({ participants }: { participants: ReportParticipant[] }) {
  return (
    <figure className="max-w-3xl">
      <p className="mb-2 text-center text-xs text-muted-foreground">{LEARNING_AXES.top}</p>
      <div className="grid grid-cols-[1.5rem_1fr_1.5rem] gap-1">
        <span className="flex items-center justify-center text-[11px] text-muted-foreground [writing-mode:vertical-rl] rotate-180">
          {LEARNING_AXES.left}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {LEARNING_GRID.flat().map((style) => {
            const people = participants.filter((p) => p.results.learningStyle === style.key)
            return (
              <div key={style.key} className="flex min-h-40 flex-col gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="text-center">
                  <p className="text-sm font-medium">{style.name}</p>
                  <p className="text-[11px] text-muted-foreground">«{style.motto}»</p>
                </div>
                <ChipList participants={people} className="justify-center" />
                {people.length > 0 && (
                  <p className="mt-auto text-center text-[10px] text-muted-foreground tabular-nums">
                    {people.length} чел.
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <span className="flex items-center justify-center text-[11px] text-muted-foreground [writing-mode:vertical-rl]">
          {LEARNING_AXES.right}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{LEARNING_AXES.bottom}</p>
    </figure>
  )
}
