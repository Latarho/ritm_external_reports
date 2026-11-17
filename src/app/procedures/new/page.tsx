import type { Metadata } from "next"
import { ProcedureEditor } from "../_components/procedure-editor"

export const metadata: Metadata = { title: "Новая процедура · Внешняя оценка" }

export default function NewProcedurePage() {
  return <ProcedureEditor procedure={null} />
}
