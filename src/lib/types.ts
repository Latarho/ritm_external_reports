export type ProcedureStatus = "draft" | "in_progress" | "completed"

/** Доступ участника к его отчёту. null — ссылка ещё не выдана / отчёта нет. */
export type ReportAccess = "open" | "closed" | null

export interface Participant {
  id: string
  fullName: string
  position: string
  sspUnit: string
  vspUnit: string
  externalLogin: string
  notify: boolean
  externalLink: string | null
  reportAccess: ReportAccess
}

export interface Procedure {
  id: string
  name: string
  type: string
  status: ProcedureStatus
  /** ISO-дата yyyy-mm-dd */
  startDate: string
  /** ISO-дата yyyy-mm-dd */
  endDate: string
  creator: string
  /** ISO-дата и время */
  updatedAt: string
  sendNotifications: boolean
  participants: Participant[]
}

/** Строка списка процедур — без самих участников. */
export interface ProcedureSummary
  extends Omit<Procedure, "participants" | "sendNotifications"> {
  participantCount: number
}

export interface ProcedureInput {
  name: string
  type: string
  startDate: string
  endDate: string
  sendNotifications: boolean
  participants: Participant[]
}

/**
 * Командный отчёт: группа участников одной запущенной процедуры
 * и руководитель, который получает сводный отчёт по команде.
 */
export interface TeamReport {
  id: string
  name: string
  procedureId: string
  /** id участника процедуры — получателя отчёта */
  leaderId: string
  /** id участников процедуры, входящих в команду */
  memberIds: string[]
  reportAccess: Exclude<ReportAccess, null>
  creator: string
  /** ISO-дата и время */
  updatedAt: string
}

export interface TeamReportSummary {
  id: string
  name: string
  procedureId: string
  procedureName: string
  leaderName: string
  memberCount: number
  reportAccess: Exclude<ReportAccess, null>
  creator: string
  updatedAt: string
}

export interface TeamReportInput {
  name: string
  procedureId: string
  leaderId: string
  memberIds: string[]
}

/** Процедура, доступная для командного отчёта, — с участниками. */
export type ProcedureOption = Pick<
  Procedure,
  "id" | "name" | "status" | "startDate" | "endDate" | "participants"
>

export const PROCEDURE_TYPES = ['Опросник "Zetic"'] as const

export const STATUS_LABELS: Record<ProcedureStatus, string> = {
  draft: "Черновик",
  in_progress: "В процессе",
  completed: "Завершена",
}
