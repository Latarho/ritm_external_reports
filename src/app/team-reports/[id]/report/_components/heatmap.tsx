import { HEATMAP_TEXT, type ScaleSection } from "@/lib/report/definitions"
import type { ReportGroup, TeamReportData } from "@/lib/report/types"
import { Explanation } from "./primitives"

/** Тепловая карта средних значений шкал по группам. */
export function Heatmap({
  section,
  groups,
  heat,
}: {
  section: ScaleSection
  groups: ReportGroup[]
  heat: TeamReportData["heat"]
}) {
  const columns = [...groups.map((g) => ({ key: g.id, name: g.name })), { key: "average", name: "Среднее" }]
  const scales = section.groups.flatMap((g) => g.scales)

  return (
    <>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-0.5 text-xs">
            <thead>
              <tr>
                <th className="w-56" />
                {columns.map((c) => (
                  <th key={c.key} className="px-2 pb-1.5 text-center font-medium text-muted-foreground">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scales.map((s) => (
                <tr key={s.key}>
                  <th scope="row" className="py-1 pr-3 text-right font-normal">
                    {s.code && <span className="text-muted-foreground">Шкала {s.code} · </span>}
                    {s.name}
                  </th>
                  {columns.map((c) => {
                    const value = heat[s.key]?.[c.key] ?? 0
                    return (
                      <td
                        key={c.key}
                        className="h-10 rounded text-center tabular-nums"
                        style={{
                          background: `color-mix(in oklch, ${section.heat} ${Math.round(value * 9)}%, var(--muted))`,
                        }}
                      >
                        {value.toFixed(2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hidden w-10 shrink-0 flex-col items-center gap-1 pt-7 text-[10px] text-muted-foreground sm:flex">
          <span>10</span>
          <div
            className="w-3 flex-1 rounded"
            style={{ background: `linear-gradient(to bottom, ${section.heat}, var(--muted))` }}
            aria-hidden
          />
          <span>0</span>
        </div>
      </div>
      <Explanation>
        {HEATMAP_TEXT.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Explanation>
    </>
  )
}
