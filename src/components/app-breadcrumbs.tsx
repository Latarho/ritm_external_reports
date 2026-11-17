"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { HomeIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Crumb {
  label: string
  href?: string
}

function crumbsFor(pathname: string): Crumb[] {
  const base: Crumb[] = [
    { label: "Администрирование" },
    { label: "Внешняя оценка" },
  ]
  if (pathname === "/procedures") return [...base, { label: "Процедуры" }]
  if (pathname === "/procedures/new")
    return [...base, { label: "Процедуры", href: "/procedures" }, { label: "Новая процедура" }]
  if (pathname.startsWith("/procedures/"))
    return [...base, { label: "Процедуры", href: "/procedures" }, { label: "Информация о процедуре" }]
  return base
}

export function AppBreadcrumbs() {
  const pathname = usePathname()
  const crumbs = crumbsFor(pathname)
  return (
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/procedures" aria-label="Главная" />}>
            <HomeIcon className="size-3.5" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={c.label}>
              <BreadcrumbSeparator className={last ? undefined : "hidden md:inline-flex"}>/</BreadcrumbSeparator>
              <BreadcrumbItem className={last ? undefined : "hidden md:inline-flex"}>
                {last ? (
                  <BreadcrumbPage className="truncate text-primary">{c.label}</BreadcrumbPage>
                ) : c.href ? (
                  <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
