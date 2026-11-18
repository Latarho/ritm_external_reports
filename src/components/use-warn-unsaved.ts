"use client"

import { useEffect } from "react"

/** Предупреждает о несохранённых изменениях при закрытии вкладки. */
export function useWarnUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])
}
