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
  if (!ids.has(input.leaderId)) return fail("Выберите руководителя из участников процедуры")
  const memberIds = [...new Set(input.memberIds)].filter((id) => id !== input.leaderId)
  if (memberIds.length === 0) return fail("Добавьте в команду хотя бы одного участника")
  if (memberIds.some((id) => !ids.has(id)))
    return fail("В команде есть участники, которых нет в выбранной процедуре")
  return { ok: true, data: { name, procedureId: procedure.id, leaderId: input.leaderId, memberIds } }
}

export async function createTeamReportAction(
  input: TeamReportInput,
): Promise<Result<{ id: string }>> {
  const checked = await check(input)
  if (!checked.ok) return checked
  const created = await store.insertTeamReport({
    ...checked.data,
    reportAccess: "closed",
    creator: CURRENT_USER.fullName,
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

export async function setTeamReportAccessAction(
  id: string,
  access: Exclude<ReportAccess, null>,
): Promise<Result> {
  const existing = await store.getTeamReport(id)
  if (!existing) return fail("Командный отчёт не найден")
  await store.updateTeamReport(id, (r) => {
    r.reportAccess = access
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
    leaderId: source.leaderId,
    memberIds: [...source.memberIds],
    reportAccess: "closed",
    creator: CURRENT_USER.fullName,
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
