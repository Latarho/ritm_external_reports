import { MailCheckIcon, MailIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmailSentStatus({
  sent,
  className,
}: {
  sent: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        sent ? "text-success" : "text-muted-foreground",
        className,
      )}
      title={sent ? "Письмо отправлено" : "Письмо не отправлено"}
    >
      {sent ? <MailCheckIcon className="size-3.5" /> : <MailIcon className="size-3.5" />}
      {sent ? "Письмо отправлено" : "Письмо не отправлено"}
    </span>
  )
}
