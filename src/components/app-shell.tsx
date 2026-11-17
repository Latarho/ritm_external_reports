import Link from "next/link"
import { Suspense } from "react"
import {
  AudioLinesIcon,
  BookOpenIcon,
  ChartLineIcon,
  CircleHelpIcon,
  CirclePlayIcon,
  FileTextIcon,
  GraduationCapIcon,
  Grid3x3Icon,
  ListTreeIcon,
  MonitorIcon,
  UserIcon,
  UserRoundCogIcon,
  WrenchIcon,
} from "lucide-react"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Документы", icon: FileTextIcon, href: null },
  { label: "Мониторинг", icon: MonitorIcon, href: null },
  { label: "Обучение", icon: GraduationCapIcon, href: null },
  { label: "Аналитика", icon: ChartLineIcon, href: null },
  { label: "Внешняя оценка", icon: UserRoundCogIcon, href: "/procedures", active: true },
  { label: "Справочники", icon: ListTreeIcon, href: null },
]

const TOOLS = [
  { label: "Видеоинструкции", icon: CirclePlayIcon },
  { label: "Помощь", icon: CircleHelpIcon },
  { label: "Настройки", icon: WrenchIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link
          href="/procedures"
          aria-label="На главную"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <AudioLinesIcon className="size-5" />
        </Link>
        <button
          type="button"
          aria-label="Приложения"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <Grid3x3Icon className="size-4" />
        </button>
        <div className="h-5 w-px bg-border" />
        <Suspense fallback={<div className="h-4 w-48" />}>
          <AppBreadcrumbs />
        </Suspense>
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {TOOLS.map(({ label, icon: Icon }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={label}
                    className="flex size-9 items-center justify-center rounded-full text-primary hover:bg-accent"
                  />
                }
              >
                <Icon className="size-5" />
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
          <div className="ml-2 flex size-9 items-center justify-center rounded-full border-2 border-primary/70 text-primary">
            <BookOpenIcon className="size-4" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-16 shrink-0 flex-col items-center gap-2 border-r bg-background py-3 sm:flex">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UserIcon className="size-5" />
          </div>
          {NAV.map(({ label, icon: Icon, href, active }) => {
            const className = cn(
              "flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary",
              active && "bg-accent text-primary",
            )
            return (
              <Tooltip key={label}>
                <TooltipTrigger
                  render={
                    href ? (
                      <Link href={href} aria-label={label} className={className} />
                    ) : (
                      <button type="button" aria-label={label} className={className} />
                    )
                  }
                >
                  <Icon className="size-5" />
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </aside>
        <main className="min-w-0 flex-1 p-3 sm:p-4">{children}</main>
      </div>
    </div>
  )
}
