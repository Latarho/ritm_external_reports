import { NotFoundPanel } from "@/components/not-found-panel"

export default function ProcedureNotFound() {
  return (
    <NotFoundPanel
      title="Процедура не найдена"
      description="Возможно, она была удалена."
      href="/procedures"
      action="К списку процедур"
    />
  )
}
