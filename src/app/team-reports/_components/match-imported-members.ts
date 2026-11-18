import type { TeamReportInput } from "@/lib/types"

type Importable = {
  id: string
  procedureId: string
  externalLogin: string
}

type ProcedurePool = { id: string; participants: { id: string }[] }

export type ImportMatch<T extends Importable> =
  | { matched: false; unknown: number; duplicates: number }
  | {
      matched: true
      accepted: T[]
      unknown: number
      duplicates: number
      skippedOtherProc: number
      targetProcedureId: string
    }

/**
 * Сопоставляет строки Excel с участниками процедур по внешнему логину.
 * Команда остаётся в одной процедуре — в той, где совпадений больше.
 */
export function matchImportedMembers<T extends Importable>(
  rows: { externalLogin: string }[],
  people: T[],
  preferredProcedureId: string | null,
  memberIds: string[],
  leaderIds: string[],
): ImportMatch<T> {
  const byLogin = new Map<string, T[]>()
  for (const person of people) {
    const key = person.externalLogin.trim().toLowerCase()
    if (!key) continue
    const list = byLogin.get(key) ?? []
    list.push(person)
    byLogin.set(key, list)
  }

  const matched: T[] = []
  let unknown = 0
  let duplicates = 0

  for (const row of rows) {
    const key = row.externalLogin.trim().toLowerCase()
    if (!key) {
      unknown++
      continue
    }
    const candidates = byLogin.get(key) ?? []
    if (candidates.length === 0) {
      unknown++
      continue
    }
    const person =
      (preferredProcedureId
        ? candidates.find((candidate) => candidate.procedureId === preferredProcedureId)
        : undefined) ?? candidates[0]
    if (matched.some((item) => item.id === person.id) || memberIds.includes(person.id)) {
      duplicates++
      continue
    }
    if (leaderIds.includes(person.id)) {
      duplicates++
      continue
    }
    matched.push(person)
  }

  if (matched.length === 0) return { matched: false, unknown, duplicates }

  const countByProc = new Map<string, number>()
  for (const person of matched) {
    countByProc.set(person.procedureId, (countByProc.get(person.procedureId) ?? 0) + 1)
  }
  let targetProcedureId = preferredProcedureId ?? matched[0].procedureId
  let best = 0
  for (const [id, count] of countByProc) {
    if (count > best) {
      best = count
      targetProcedureId = id
    }
  }
  const accepted = matched.filter((person) => person.procedureId === targetProcedureId)
  return {
    matched: true,
    accepted,
    unknown,
    duplicates,
    skippedOtherProc: matched.length - accepted.length,
    targetProcedureId,
  }
}

/** Новые участники, руководители и группы после загрузки Excel. */
export function formAfterMemberImport(
  form: TeamReportInput,
  procedures: ProcedurePool[],
  acceptedIds: string[],
  targetProcedureId: string,
): Pick<TeamReportInput, "procedureId" | "memberIds" | "leaderIds" | "groups"> {
  const inProcedure = new Set(
    procedures.find((procedure) => procedure.id === targetProcedureId)?.participants.map((p) => p.id) ??
      [],
  )
  const keptMembers =
    form.procedureId === targetProcedureId
      ? form.memberIds.filter((id) => inProcedure.has(id))
      : []
  const memberIds = [...new Set([...keptMembers, ...acceptedIds])]
  return {
    procedureId: targetProcedureId,
    memberIds,
    leaderIds: form.leaderIds.filter((id) => inProcedure.has(id)),
    groups:
      form.procedureId === targetProcedureId
        ? form.groups
            .map((group) => ({
              ...group,
              memberIds: group.memberIds.filter((id) => memberIds.includes(id)),
            }))
            .filter((group) => group.memberIds.length > 0)
        : [],
  }
}
