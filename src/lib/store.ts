import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import { CURRENT_USER } from "./current-user"
import { buildSeed, buildTeamReportSeed } from "./seed"
import type {
  Procedure,
  ProcedureOption,
  ProcedureSummary,
  TeamReport,
  TeamReportSummary,
} from "./types"

/**
 * Простое файловое хранилище (data/db.json) — заменяется на настоящий API/БД.
 * При первом обращении заполняется демо-данными.
 */
const DB_PATH = path.join(process.cwd(), "data", "db.json")

interface Db {
  procedures: Procedure[]
  teamReports: TeamReport[]
}

let writeQueue: Promise<unknown> = Promise.resolve()

async function readDb(): Promise<Db> {
  let db: Db
  try {
    db = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
    const procedures = buildSeed()
    db = { procedures, teamReports: buildTeamReportSeed(procedures) }
    await writeDb(db)
    return db
  }
  // Файл из предыдущей версии — без командных отчётов.
  if (!Array.isArray(db.teamReports)) {
    db.teamReports = buildTeamReportSeed(db.procedures)
    await writeDb(db)
  }
  // Миграции старых записей командных отчётов.
  let touched = false
  for (const r of db.teamReports as Array<TeamReport & { leaderId?: string }>) {
    if (!Array.isArray(r.hrbpIds)) {
      r.hrbpIds = []
      touched = true
    }
    if (!Array.isArray(r.leaderIds)) {
      r.leaderIds = r.leaderId ? [r.leaderId] : []
      delete r.leaderId
      touched = true
    }
    if (r.hrbpReportAccess !== "open" && r.hrbpReportAccess !== "closed") {
      r.hrbpReportAccess = "closed"
      touched = true
    }
    if (!Array.isArray(r.groups)) {
      r.groups = []
      touched = true
    }
    if (!r.updatedBy) {
      r.updatedBy = r.creator
      touched = true
    }
    if (typeof r.reportEmailSent !== "boolean") {
      r.reportEmailSent = false
      touched = true
    }
    if (typeof r.hrbpEmailSent !== "boolean") {
      r.hrbpEmailSent = false
      touched = true
    }
  }
  if (touched) await writeDb(db)
  return db
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  // Уникальное имя: параллельные записи (например, первичное заполнение) не мешают друг другу.
  const tmp = `${DB_PATH}.${process.pid}.${crypto.randomUUID()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8")
  await fs.rename(tmp, DB_PATH)
}

/** Последовательно выполняет изменения, чтобы параллельные записи не затирали друг друга. */
function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb()
    const result = await fn(db)
    await writeDb(db)
    return result
  })
  writeQueue = run.catch(() => undefined)
  return run
}

function nextId(items: { id: string }[]): string {
  return String(items.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1)
}

// ---------- Процедуры ----------

export async function listProcedures(): Promise<ProcedureSummary[]> {
  const db = await readDb()
  return db.procedures.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    creator: p.creator,
    updatedAt: p.updatedAt,
    participantCount: p.participants.length,
  }))
}

export async function getProcedure(id: string): Promise<Procedure | null> {
  const db = await readDb()
  return db.procedures.find((p) => p.id === id) ?? null
}

export function insertProcedure(data: Omit<Procedure, "id">): Promise<Procedure> {
  return mutate((db) => {
    const procedure: Procedure = { ...data, id: nextId(db.procedures) }
    db.procedures.unshift(procedure)
    return procedure
  })
}

export function updateProcedure(
  id: string,
  fn: (p: Procedure) => void,
): Promise<Procedure> {
  return mutate((db) => {
    const procedure = db.procedures.find((p) => p.id === id)
    if (!procedure) throw new Error("Процедура не найдена")
    fn(procedure)
    procedure.updatedAt = new Date().toISOString()
    return procedure
  })
}

/** Удаляет процедуру вместе с её командными отчётами. */
export function deleteProcedure(id: string): Promise<void> {
  return mutate((db) => {
    db.procedures = db.procedures.filter((p) => p.id !== id)
    db.teamReports = db.teamReports.filter((r) => r.procedureId !== id)
  })
}

export async function countTeamReportsForProcedure(id: string): Promise<number> {
  const db = await readDb()
  return db.teamReports.filter((r) => r.procedureId === id).length
}

// ---------- Командные отчёты ----------

/** Процедуры, по которым можно строить командные отчёты (запущенные и завершённые). */
export async function listLaunchedProcedures(): Promise<ProcedureOption[]> {
  const db = await readDb()
  return db.procedures
    .filter((p) => p.status !== "draft")
    .map(({ id, name, status, startDate, endDate, participants }) => ({
      id,
      name,
      status,
      startDate,
      endDate,
      participants,
    }))
}

export async function listTeamReports(): Promise<TeamReportSummary[]> {
  const db = await readDb()
  const procedures = new Map(db.procedures.map((p) => [p.id, p]))
  const peopleById = new Map(
    db.procedures.flatMap((p) => p.participants.map((person) => [person.id, person.fullName] as const)),
  )
  return db.teamReports.map((r) => {
    const procedure = procedures.get(r.procedureId)
    const leaders = (r.leaderIds ?? [])
      .map((id) => peopleById.get(id))
      .filter((name): name is string => Boolean(name))
    const hrbps = (r.hrbpIds ?? [])
      .map((id) => peopleById.get(id))
      .filter((name): name is string => Boolean(name))
    return {
      id: r.id,
      name: r.name,
      procedureId: r.procedureId,
      procedureName: procedure?.name ?? "—",
      leaderName: leaders.length ? leaders.join(", ") : "—",
      hrbpName: hrbps.length ? hrbps.join(", ") : "—",
      memberCount: r.memberIds.length,
      reportAccess: r.reportAccess,
      hrbpReportAccess: r.hrbpReportAccess ?? "closed",
      reportEmailSent: Boolean(r.reportEmailSent),
      hrbpEmailSent: Boolean(r.hrbpEmailSent),
      creator: r.creator,
      updatedBy: r.updatedBy || r.creator,
      updatedAt: r.updatedAt,
    }
  })
}

export async function getTeamReport(id: string): Promise<TeamReport | null> {
  const db = await readDb()
  return db.teamReports.find((r) => r.id === id) ?? null
}

export function insertTeamReport(data: Omit<TeamReport, "id">): Promise<TeamReport> {
  return mutate((db) => {
    const report: TeamReport = { ...data, id: nextId(db.teamReports) }
    db.teamReports.unshift(report)
    return report
  })
}

export function updateTeamReport(
  id: string,
  fn: (r: TeamReport) => void,
): Promise<TeamReport> {
  return mutate((db) => {
    const report = db.teamReports.find((r) => r.id === id)
    if (!report) throw new Error("Командный отчёт не найден")
    fn(report)
    report.updatedAt = new Date().toISOString()
    report.updatedBy = CURRENT_USER.fullName
    return report
  })
}

export function deleteTeamReport(id: string): Promise<void> {
  return mutate((db) => {
    db.teamReports = db.teamReports.filter((r) => r.id !== id)
  })
}
