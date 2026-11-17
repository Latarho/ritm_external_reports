import { ORGANIZATION } from "@/lib/organization"
import type { Procedure, TeamReport } from "@/lib/types"
import { COMPETENCIES, SCALE_SECTIONS } from "./definitions"
import { demoResults } from "./demo-results"
import type {
  IntegralPoint,
  ReportGroup,
  ReportParticipant,
  TeamReportData,
} from "./types"

const mean = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0

function stdev(values: number[]) {
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

/** Максимально возможное стандартное отклонение для шкалы 0–100 — 50. */
function integral(participants: ReportParticipant[]): IntegralPoint[] {
  return COMPETENCIES.map((competency) => {
    const values = participants.map((p) => p.results.competencies[competency])
    return {
      competency,
      manifestation: Math.round(mean(values)),
      consistency: Math.round(Math.max(0, 100 - (stdev(values) / 50) * 100 * 1.6)),
    }
  })
}

/** Собирает данные командного отчёта: участники, группы и агрегаты. */
export function buildTeamReportData(report: TeamReport, procedure: Procedure): TeamReportData {
  const byId = new Map(procedure.participants.map((p) => [p.id, p]))
  const people = [
    ...(byId.has(report.leaderId) ? [{ id: report.leaderId, group: "leader" as const }] : []),
    ...report.memberIds.filter((id) => byId.has(id)).map((id) => ({ id, group: "team" as const })),
  ]

  const participants: ReportParticipant[] = people
    .map(({ id, group }) => {
      const p = byId.get(id)!
      return {
        number: 0,
        id,
        fullName: p.fullName,
        position: p.position,
        group,
        results: demoResults(id),
      }
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"))
    .map((p, i) => ({ ...p, number: i + 1 }))

  const groups: ReportGroup[] = [
    { id: "team", name: report.name },
    { id: "leader", name: "Руководитель" },
  ]
  const team = participants.filter((p) => p.group === "team")
  const leader = participants.filter((p) => p.group === "leader")

  const heat: TeamReportData["heat"] = {}
  for (const section of SCALE_SECTIONS) {
    for (const group of section.groups) {
      for (const scale of group.scales) {
        const teamAvg = mean(team.map((p) => p.results.scales[scale.key]))
        const leaderAvg = mean(leader.map((p) => p.results.scales[scale.key]))
        const present = [team.length ? teamAvg : null, leader.length ? leaderAvg : null].filter(
          (v): v is number => v !== null,
        )
        heat[scale.key] = { team: teamAvg, leader: leaderAvg, average: mean(present) }
      }
    }
  }

  return {
    title: report.name,
    createdAt: report.updatedAt,
    survey: procedure.type,
    company: ORGANIZATION.name,
    procedureName: procedure.name,
    groups,
    participants,
    integralAll: integral(participants),
    integralTeam: integral(team),
    competencyAverages: Object.fromEntries(
      COMPETENCIES.map((c) => [c, Math.round(mean(participants.map((p) => p.results.competencies[c])))]),
    ),
    heat,
    isDemo: true,
  }
}
