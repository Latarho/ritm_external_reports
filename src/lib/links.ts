/** Базовый адрес анкеты внешней оценки. Задаётся переменной окружения. */
const QUESTIONNAIRE_BASE_URL =
  process.env.NEXT_PUBLIC_QUESTIONNAIRE_BASE_URL ??
  "https://questionnaire.example.com/questionnaire"

export function buildExternalLink(participantId: string): string {
  // Детерминированный «токен» из id, чтобы ссылка была стабильной.
  let h = 0x811c9dc5
  for (const ch of participantId) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  const token = (h >>> 0).toString(16).toUpperCase().padStart(8, "0")
  return `${QUESTIONNAIRE_BASE_URL}/${token}${participantId.toUpperCase().replace(/[^A-Z0-9]/g, "")}`
}
