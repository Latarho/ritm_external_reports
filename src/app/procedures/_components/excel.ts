"use client"

import { toast } from "sonner"
import { exportParticipantsAction } from "../actions"
import type { Participant } from "@/lib/types"

export async function downloadParticipantsExcel(participants: Participant[], name: string) {
  const res = await exportParticipantsAction(participants)
  if (!res.ok) return void toast.error(res.error)
  const bytes = Uint8Array.from(atob(res.data.base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${(name.trim() || "Сотрудники").replace(/[\\/:*?"<>|]/g, "_")}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
