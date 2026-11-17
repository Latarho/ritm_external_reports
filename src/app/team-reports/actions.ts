"use server"

import { revalidatePath } from "next/cache"
import { CURRENT_USER } from "@/lib/current-user"
import * as store from "@/lib/store"
import type { ReportAccess, TeamReportInput } from "@/lib/types"

// TODO: при подключении к реальной системе — проверять права пользователя в каждом действии.

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function revalidate() {
  revalidatePath("/team-reports", "layout")
}

/** Проверяет ввод и возвращает нормализованные данные или текст ошибки. */
async function check(
  input: TeamReportInput,
): Promise<{ ok: true; data: TeamReportInput } | { ok: false; error: string }> {
  const name = input.name.trim()
  if (!name) return fail("Укажите название отчёта")
  const procedure = await store.getProcedure(input.procedureId)
  if (!procedure) return fail("Выберите процедуру")
  if (procedure.status === "draft")
    return fail("Командный отчёт можно создать только по запущенной процедуре")
  const ids = new Set(procedure.participants.map((p) => p.id))
  const leaderIds = [...new Set(input.leaderIds)]
  if (leaderIds.some((id) => !ids.has(id)))
    return fail("Выберите руководителей из участников процедуры")
  const leaderSet = new Set(leaderIds)
  // Сотрудников ДРП можно выбирать из любой запущенной процедуры, независимо от руководителей.
  const launched = await store.listLaunchedProcedures()
  const allPeople = new Set(launched.flatMap((p) => p.participants.map((person) => person.id)))
  const hrbpIds = [...new Set(input.hrbpIds)].filter((id) => !leaderSet.has(id))
  if (hrbpIds.some((id) => !allPeople.has(id)))
    return fail("Среди сотрудников ДРП есть люди, которых нет в запущенных процедурах")
  const memberIds = [...new Set(input.memberIds)].filter((id) => !leaderSet.has(id))
  if (memberIds.length === 0) return fail("Добавьте в команду хотя бы одного участника")
  if (memberIds.some((id) => !ids.has(id)))
    return fail("В команде есть участники, которых нет в выбранной процедуре")
  const memberSet = new Set(memberIds)
  const groups = (input.groups ?? [])
    .map((g, i) => ({
      id: g.id.trim() || `g${i + 1}`,
      name: g.name.trim(),
      memberIds: [...new Set(g.memberIds)].filter((id) => memberSet.has(id)),
    }))
    .filter((g) => g.name && g.memberIds.length > 0)
  return {
    ok: true,
    data: { name, procedureId: procedure.id, leaderIds, hrbpIds, memberIds, groups },
  }
}

export async function createTeamReportAction(
  input: TeamReportInput,
): Promise<Result<{ id: string }>> {
  const checked = await check(input)
  if (!checked.ok) return checked
  const created = await store.insertTeamReport({
    ...checked.data,
    reportAccess: "closed",
    hrbpReportAccess: "closed",
    reportEmailSent: false,
    hrbpEmailSent: false,
    creator: CURRENT_USER.fullName,
    updatedBy: CURRENT_USER.fullName,
    updatedAt: new Date().toISOString(),
  })
  revalidate()
  return { ok: true, data: { id: created.id } }
}

export async function updateTeamReportAction(
  id: string,
  input: TeamReportInput,
): Promise<Result> {
  const existing = await store.getTeamReport(id)
  if (!existing) return fail("Командный отчёт не найден")
  const checked = await check(input)
  if (!checked.ok) return checked
  await store.updateTeamReport(id, (r) => Object.assign(r, checked.data))
  revalidate()
  return { ok: true, data: undefined }
}

export type TeamReportAccessAudience = "leader" | "hrbp"

export async function setTeamReportAccessAction(
  id: string,
  access: Exclude<ReportAccess, null>,
  audience: TeamReportAccessAudience = "leader",
  options?: { sendEmail?: boolean },
): Promise<Result> {
  const existing = await store.getTeamReport(id)
  if (!existing) return fail("Командный отчёт не найден")
  await store.updateTeamReport(id, (r) => {
    if (audience === "hrbp") {
      r.hrbpReportAccess = access
      if (access === "open" && options?.sendEmail) r.hrbpEmailSent = true
    } else {
      r.reportAccess = access
      if (access === "open" && options?.sendEmail) r.reportEmailSent = true
    }
  })
  revalidate()
  return { ok: true, data: undefined }
}

export async function duplicateTeamReportAction(id: string): Promise<Result<{ id: string }>> {
  const source = await store.getTeamReport(id)
  if (!source) return fail("Командный отчёт не найден")
  const created = await store.insertTeamReport({
    name: `${source.name} (копия)`,
    procedureId: source.procedureId,
    leaderIds: [...source.leaderIds],
    hrbpIds: [...source.hrbpIds],
    memberIds: [...source.memberIds],
    groups: source.groups.map((g) => ({ ...g, memberIds: [...g.memberIds] })),
    reportAccess: "closed",
    hrbpReportAccess: "closed",
    reportEmailSent: false,
    hrbpEmailSent: false,
    creator: CURRENT_USER.fullName,
    updatedBy: CURRENT_USER.fullName,
    updatedAt: new Date().toISOString(),
  })
  revalidate()
  return { ok: true, data: { id: created.id } }
}

export async function deleteTeamReportAction(id: string): Promise<Result> {
  await store.deleteTeamReport(id)
  revalidate()
  return { ok: true, data: undefined }
}
