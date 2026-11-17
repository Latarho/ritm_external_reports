/** Палитра кружков групп в отчёте (leader — отдельно зелёным). */
const PALETTE = [
  "bg-primary/20 ring-1 ring-primary/40 text-primary",
  "bg-sky-200/80 ring-1 ring-sky-400/50 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100",
  "bg-amber-200/80 ring-1 ring-amber-400/50 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100",
  "bg-violet-200/80 ring-1 ring-violet-400/50 text-violet-950 dark:bg-violet-900/50 dark:text-violet-100",
  "bg-rose-200/80 ring-1 ring-rose-400/50 text-rose-950 dark:bg-rose-900/50 dark:text-rose-100",
  "bg-teal-200/80 ring-1 ring-teal-400/50 text-teal-950 dark:bg-teal-900/50 dark:text-teal-100",
] as const

const DOT_PALETTE = [
  "bg-primary/20 ring-1 ring-primary/40",
  "bg-sky-400 ring-1 ring-sky-500/40",
  "bg-amber-400 ring-1 ring-amber-500/40",
  "bg-violet-400 ring-1 ring-violet-500/40",
  "bg-rose-400 ring-1 ring-rose-500/40",
  "bg-teal-400 ring-1 ring-teal-500/40",
] as const

export function groupChipClass(groupId: string, groupIds: string[]): string {
  if (groupId === "leader") return "bg-success text-white ring-2 ring-success/30"
  const idx = Math.max(0, groupIds.filter((id) => id !== "leader").indexOf(groupId))
  return PALETTE[idx % PALETTE.length]
}

export function groupDotClass(groupId: string, groupIds: string[]): string {
  if (groupId === "leader") return "bg-success ring-2 ring-success/30"
  const idx = Math.max(0, groupIds.filter((id) => id !== "leader").indexOf(groupId))
  return DOT_PALETTE[idx % DOT_PALETTE.length]
}
