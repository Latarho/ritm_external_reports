import {
  ROLE_AXES,
  ROLE_FAMILIES,
  ROLE_GRID,
  ROLES,
  ROLES_TEXT,
  type RoleFamily,
} from "@/lib/report/definitions"
import type { ReportParticipant } from "@/lib/report/types"
import { cn } from "@/lib/utils"
import { ChipList } from "./primitives"

const FAMILY_STYLE: Record<RoleFamily, { cell: string; title: string }> = {
  integrators: { cell: "bg-amber-50 dark:bg-amber-950/30", title: "text-amber-700 dark:text-amber-300" },
  entrepreneurs: { cell: "bg-fuchsia-50 dark:bg-fuchsia-950/30", title: "text-fuchsia-700 dark:text-fuchsia-300" },
  administrators: { cell: "bg-sky-50 dark:bg-sky-950/30", title: "text-sky-700 dark:text-sky-300" },
  producers: { cell: "bg-emerald-50 dark:bg-emerald-950/30", title: "text-emerald-700 dark:text-emerald-300" },
}

/** Блоки 2×2 по семействам: [верх-лево, верх-право, низ-лево, низ-право]. */
const BLOCKS: { family: RoleFamily; rows: [number, number]; cols: [number, number] }[] = [
  { family: "integrators", rows: [0, 1], cols: [0, 1] },
  { family: "entrepreneurs", rows: [0, 1], cols: [2, 3] },
  { family: "administrators", rows: [2, 3], cols: [0, 1] },
  { family: "producers", rows: [2, 3], cols: [2, 3] },
]

export function RolesGrid({ participants }: { participants: ReportParticipant[] }) {
  const byRole = (key: string) => participants.filter((p) => p.results.role === key)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="mb-2 grid grid-cols-2 pl-6 text-center text-xs text-muted-foreground">
          {ROLE_AXES.top.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_1.5rem] gap-1">
          <div className="grid grid-rows-2 text-[11px] text-muted-foreground">
            {ROLE_AXES.left.map((t) => (
              <span key={t} className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180">
                {t}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BLOCKS.map(({ family, rows, cols }) => {
              const info = ROLE_FAMILIES[family]
              return (
                <div key={family} className="overflow-hidden rounded-lg border">
                  <div className="border-b bg-background px-3 py-2 text-center">
                    <p className={cn("text-sm font-semibold", FAMILY_STYLE[family].title)}>{info.title}</p>
                    <p className="text-[11px] text-muted-foreground">{info.short}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-border">
                    {rows.flatMap((r) =>
                      cols.map((c) => {
                        const role = ROLE_GRID[r][c]
                        const people = byRole(role.key)
                        return (
                          <div key={role.key} className={cn("flex min-h-28 flex-col gap-2 p-2.5", FAMILY_STYLE[family].cell)}>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium">{role.name}</span>
                              {people.length > 0 && (
                                <span className="text-[10px] text-muted-foreground tabular-nums">{people.length}</span>
                              )}
                            </div>
                            <ChipList participants={people} />
                          </div>
                        )
                      }),
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-rows-2 text-[11px] text-muted-foreground">
            {ROLE_AXES.right.map((t) => (
              <span key={t} className="flex items-center justify-center [writing-mode:vertical-rl]">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RoleDescriptions() {
  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">{ROLES_TEXT}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(ROLE_FAMILIES) as RoleFamily[]).map((family) => {
          const info = ROLE_FAMILIES[family]
          return (
            <div key={family} className={cn("rounded-lg p-4", FAMILY_STYLE[family].cell)}>
              <h3 className={cn("text-sm font-semibold", FAMILY_STYLE[family].title)}>{info.title}</h3>
              <p className="mt-1 text-xs text-foreground/80">{info.description}</p>
              <dl className="mt-3 grid gap-2 text-xs">
                {ROLES.filter((r) => r.family === family).map((r) => (
                  <div key={r.key}>
                    <dt className="font-medium">{r.name}</dt>
                    <dd className="text-foreground/75">{r.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    </>
  )
}
