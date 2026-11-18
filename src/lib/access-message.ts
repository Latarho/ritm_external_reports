import type { TeamReportAccessAudience } from "@/app/team-reports/actions"

/** Текст тоста после смены доступа к командному отчёту. */
export function teamReportAccessMessage(
  audience: TeamReportAccessAudience,
  opened: boolean,
  withEmail: boolean,
): string {
  if (audience === "hrbp") {
    if (!opened) return "Доступ сотрудника ДРП закрыт"
    return withEmail
      ? "Доступ сотрудника ДРП открыт, письмо отправлено"
      : "Доступ сотрудника ДРП открыт"
  }
  if (!opened) return "Доступ руководителю закрыт"
  return withEmail ? "Доступ руководителю открыт, письмо отправлено" : "Доступ руководителю открыт"
}
