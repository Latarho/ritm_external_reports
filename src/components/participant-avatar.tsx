import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function ParticipantAvatar({ fullName }: { fullName: string }) {
  return (
    <Avatar>
      <AvatarFallback className="bg-accent text-[11px] font-semibold text-primary">
        {initials(fullName) || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
