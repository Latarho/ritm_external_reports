import Link from "next/link"
import { Button } from "@/components/ui/button"

export function NotFoundPanel({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href: string
  action: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-background p-10 text-center shadow-xs">
      <h1 className="text-base font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button render={<Link href={href} />} nativeButton={false}>
        {action}
      </Button>
    </div>
  )
}
