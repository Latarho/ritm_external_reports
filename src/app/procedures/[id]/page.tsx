import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getProcedure } from "@/lib/store"
import { ProcedureEditor } from "../_components/procedure-editor"

export default function ProcedurePage({ params }: PageProps<"/procedures/[id]">) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <ProcedureData params={params} />
    </Suspense>
  )
}

async function ProcedureData({ params }: Pick<PageProps<"/procedures/[id]">, "params">) {
  const { id } = await params
  const procedure = await getProcedure(id)
  if (!procedure) notFound()
  return <ProcedureEditor key={procedure.id} procedure={procedure} />
}

function EditorFallback() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Загрузка">
      <div className="h-32 animate-pulse rounded-xl bg-background" />
      <div className="h-80 animate-pulse rounded-xl bg-background" />
    </div>
  )
}
