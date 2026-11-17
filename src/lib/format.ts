import { format, parseISO } from "date-fns"

/** yyyy-mm-dd или ISO-время → dd.MM.yyyy */
export function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  try {
    return format(parseISO(value), "dd.MM.yyyy")
  } catch {
    return value
  }
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
