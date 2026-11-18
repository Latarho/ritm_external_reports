"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { PlayIcon } from "lucide-react"
import { toast } from "sonner"
import { DatePicker } from "@/components/date-picker"
import { useWarnUnsaved } from "@/components/use-warn-unsaved"
import { ProcedureActionsMenu } from "@/components/procedure-actions-menu"
import { StatusBadge } from "@/components/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { pluralRu } from "@/lib/format"
import { PROCEDURE_TYPES, type Procedure, type ProcedureInput } from "@/lib/types"
import {
  createProcedureAction,
  launchProcedureAction,
  updateProcedureAction,
} from "../actions"
import { DraftParticipants } from "./draft-participants"
import { DownloadExcelButton, LaunchedParticipants } from "./launched-participants"

function toInput(p: Procedure | null): ProcedureInput {
  return {
    name: p?.name ?? "",
    type: p?.type ?? PROCEDURE_TYPES[0],
    startDate: p?.startDate ?? "",
    endDate: p?.endDate ?? "",
    sendNotifications: p?.sendNotifications ?? true,
    participants: p?.participants ?? [],
  }
}

const TYPE_ITEMS = PROCEDURE_TYPES.map((t) => ({ value: t, label: t }))

export function ProcedureEditor({ procedure }: { procedure: Procedure | null }) {
  const router = useRouter()
  const editable = !procedure || procedure.status === "draft"
  const initial = useMemo(() => toInput(procedure), [procedure])
  const [form, setForm] = useState<ProcedureInput>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [confirmLaunch, setConfirmLaunch] = useState(false)
  const [pending, startTransition] = useTransition()

  // После сохранения сервер присылает свежие данные — синхронизируем форму.
  const [syncedFrom, setSyncedFrom] = useState(procedure)
  if (procedure !== syncedFrom) {
    setSyncedFrom(procedure)
    setForm(initial)
  }

  const dirty = editable && JSON.stringify(form) !== JSON.stringify(initial)
  useWarnUnsaved(dirty)

  const errors = {
    name: !form.name.trim() ? "Укажите название" : null,
    startDate: !form.startDate ? "Укажите дату начала" : null,
    endDate: !form.endDate
      ? "Укажите дату окончания"
      : form.startDate && form.endDate < form.startDate
        ? "Раньше даты начала"
        : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  function set<K extends keyof ProcedureInput>(key: K, value: ProcedureInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  /** Сохраняет форму. Возвращает id процедуры или null при ошибке. */
  async function persist(): Promise<string | null> {
    if (procedure) {
      const res = await updateProcedureAction(procedure.id, form)
      if (!res.ok) return toast.error(res.error), null
      return procedure.id
    }
    const res = await createProcedureAction(form)
    if (!res.ok) return toast.error(res.error), null
    return res.data.id
  }

  function save() {
    setSubmitted(true)
    if (hasErrors) return void toast.error("Заполните обязательные поля")
    startTransition(async () => {
      const id = await persist()
      if (!id) return
      toast.success(procedure ? "Изменения сохранены" : "Процедура создана")
      if (procedure) router.refresh()
      else router.replace(`/procedures/${id}`)
    })
  }

  function requestLaunch() {
    setSubmitted(true)
    if (hasErrors) return void toast.error("Заполните обязательные поля")
    if (form.participants.length === 0)
      return void toast.error("Добавьте хотя бы одного сотрудника перед запуском")
    setConfirmLaunch(true)
  }

  function launch() {
    startTransition(async () => {
      const id = await persist()
      if (!id) return setConfirmLaunch(false)
      const res = await launchProcedureAction(id)
      setConfirmLaunch(false)
      if (!res.ok) return void toast.error(res.error)
      toast.success("Процедура запущена")
      if (procedure) router.refresh()
      else router.replace(`/procedures/${id}`)
    })
  }

  const show = (key: keyof typeof errors) => (submitted ? errors[key] : null)
  const count = form.participants.length

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">Данные процедуры</h1>
          {procedure && <StatusBadge status={procedure.status} />}
          {procedure && (
            <div className="ml-auto">
              <ProcedureActionsMenu
                id={procedure.id}
                name={procedure.name}
                status={procedure.status}
                showOpen={false}
                showLaunch={false}
                afterDelete={() => router.replace("/procedures")}
              />
            </div>
          )}
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
          <Field id="name" label="Название" error={show("name")}>
            <Input
              id="name"
              value={form.name}
              disabled={!editable}
              placeholder="Напишите название"
              aria-invalid={!!show("name") || undefined}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field id="type" label="Тип процедуры">
            <Select
              items={TYPE_ITEMS}
              value={form.type}
              disabled={!editable}
              onValueChange={(v) => v && set("type", v)}
            >
              <SelectTrigger id="type" className="w-full disabled:bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_ITEMS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="startDate" label="Дата начала" error={show("startDate")}>
            <DatePicker
              id="startDate"
              value={form.startDate}
              disabled={!editable}
              invalid={!!show("startDate")}
              placeholder="Выберите дату начала"
              onChange={(v) => set("startDate", v)}
            />
          </Field>
          <Field id="endDate" label="Дата окончания" error={show("endDate")}>
            <DatePicker
              id="endDate"
              value={form.endDate}
              disabled={!editable}
              invalid={!!show("endDate")}
              placeholder="Выберите дату окончания"
              minDate={form.startDate || undefined}
              onChange={(v) => set("endDate", v)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl bg-background shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-base font-semibold">Список сотрудников</h2>
          {!editable && procedure && (
            <DownloadExcelButton participants={procedure.participants} name={procedure.name} />
          )}
        </div>
        <div className="p-4">
          {editable ? (
            <DraftParticipants
              participants={form.participants}
              onChange={(participants) => set("participants", participants)}
              sendNotifications={form.sendNotifications}
              onSendNotificationsChange={(v) => set("sendNotifications", v)}
              procedureName={form.name}
            />
          ) : (
            <LaunchedParticipants
              procedureId={procedure!.id}
              procedureName={procedure!.name}
              participants={procedure!.participants}
            />
          )}
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
            <Button size="lg" className="px-4" disabled={pending} onClick={save}>
              Сохранить
            </Button>
            <Button size="lg" variant="outline" disabled={pending} onClick={requestLaunch}>
              <PlayIcon /> Сохранить и запустить
            </Button>
            {dirty && (
              <span className="text-xs text-muted-foreground">Есть несохранённые изменения</span>
            )}
          </div>
        )}
      </section>

      <AlertDialog open={confirmLaunch} onOpenChange={setConfirmLaunch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Запустить процедуру?</AlertDialogTitle>
            <AlertDialogDescription>
              {count} {pluralRu(count, "сотрудник получит", "сотрудника получат", "сотрудников получат")}{" "}
              внешние ссылки на опросник
              {form.sendNotifications ? " и уведомления" : ""}. После запуска данные процедуры и
              список сотрудников редактировать нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={launch}>
              Запустить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        <span className="text-destructive">*</span>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
