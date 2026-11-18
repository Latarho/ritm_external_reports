import { notFound } from "next/navigation"
import { Suspense } from "react"
import { EditorFallback } from "@/components/editor-fallback"
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
