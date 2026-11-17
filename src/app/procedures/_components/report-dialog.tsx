"use client"

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"
import { useState } from "react"
import { ParticipantAvatar } from "@/components/participant-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Participant } from "@/lib/types"
import { AccessStatus } from "./access-status"

export function ReportDialog({
  participant,
  procedureName,
  onOpenChange,
}: {
  participant: Participant | null
  procedureName: string
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Dialog open={participant !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {participant && (
          <>
            <DialogHeader>
              <DialogTitle>Отчёт участника</DialogTitle>
              <DialogDescription>{procedureName}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3">
              <ParticipantAvatar fullName={participant.fullName} />
              <div className="min-w-0">
                <p className="font-medium">{participant.fullName}</p>
                <p className="text-xs text-muted-foreground">{participant.position || "—"}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Подразделение ССП</dt>
              <dd>{participant.sspUnit || "—"}</dd>
              <dt className="text-muted-foreground">Подразделение ВСП</dt>
              <dd>{participant.vspUnit || "—"}</dd>
              <dt className="text-muted-foreground">Внешний логин</dt>
              <dd>{participant.externalLogin}</dd>
              <dt className="text-muted-foreground">Доступ к отчёту</dt>
              <dd>
                <AccessStatus access={participant.reportAccess} />
              </dd>
            </dl>
            {participant.externalLink && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                <code className="min-w-0 flex-1 truncate text-xs">{participant.externalLink}</code>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Скопировать ссылку"
                  onClick={async () => {
                    await navigator.clipboard.writeText(participant.externalLink!)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Открыть ссылку"
                  nativeButton={false}
                  render={<a href={participant.externalLink} target="_blank" rel="noreferrer" />}
                >
                  <ExternalLinkIcon />
                </Button>
              </div>
            )}
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Результаты оценки появятся здесь после того, как участник пройдёт опросник.
              Подключение к источнику отчётов пока не настроено.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
