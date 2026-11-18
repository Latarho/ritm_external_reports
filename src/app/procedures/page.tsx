import { connection } from "next/server"
import { ListSection } from "@/components/list-section"
import { listProcedures } from "@/lib/store"
import { ProceduresTable } from "./procedures-table"

export default function ProceduresPage() {
  return (
    <ListSection section="procedures" title="Список процедур" createHref="/procedures/new">
      <ProceduresData />
    </ListSection>
  )
}

async function ProceduresData() {
  await connection()
  const procedures = await listProcedures()
  return <ProceduresTable procedures={procedures} />
}
