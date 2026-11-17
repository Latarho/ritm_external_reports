export function EditorFallback() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Загрузка">
      <div className="h-32 animate-pulse rounded-xl bg-background" />
      <div className="h-80 animate-pulse rounded-xl bg-background" />
    </div>
  )
}
