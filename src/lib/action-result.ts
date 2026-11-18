/** Ответ серверного действия: либо данные, либо текст ошибки для тоста. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

export function actionError(error: string): { ok: false; error: string } {
  return { ok: false, error }
}
