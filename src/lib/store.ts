import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import { buildSeed } from "./seed"
import type { Procedure, ProcedureSummary } from "./types"

/**
 * Простое файловое хранилище (data/db.json) — заменяется на настоящий API/БД.
 * При первом обращении заполняется демо-данными.
 */
const DB_PATH = path.join(process.cwd(), "data", "db.json")

interface Db {
  procedures: Procedure[]
}

let writeQueue: Promise<unknown> = Promise.resolve()

async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
    const db: Db = { procedures: buildSeed() }
    await writeDb(db)
    return db
  }
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.${process.pid}.tmp`
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
    const nextId =
      db.procedures.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1
    const procedure: Procedure = { ...data, id: String(nextId) }
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

export function deleteProcedure(id: string): Promise<void> {
  return mutate((db) => {
    db.procedures = db.procedures.filter((p) => p.id !== id)
  })
}
