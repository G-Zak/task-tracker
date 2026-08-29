
export function PageLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-200 rounded-lg w-1/4"></div>
      <div className="h-4 bg-zinc-200 rounded-lg w-1/2"></div>
      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <div className="h-32 bg-zinc-200 rounded-xl"></div>
        <div className="h-32 bg-zinc-200 rounded-xl"></div>
      </div>
    </div>
  )
}
