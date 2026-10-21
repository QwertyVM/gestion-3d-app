import { Skeleton } from '@/components/ui/skeleton'

export default function PedidosLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-card border border-border rounded-xl shadow-xs flex flex-wrap gap-2.5 items-center justify-between">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="h-10 bg-secondary/40 border-b border-border/70 px-4 flex items-center justify-between">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
