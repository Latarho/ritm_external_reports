import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProcedureNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-background p-10 text-center shadow-xs">
      <h1 className="text-base font-semibold">Процедура не найдена</h1>
      <p className="text-sm text-muted-foreground">Возможно, она была удалена.</p>
      <Button render={<Link href="/procedures" />} nativeButton={false}>
        К списку процедур
      </Button>
    </div>
  )
}
