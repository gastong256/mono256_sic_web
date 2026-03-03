import { Skeleton } from '@/shared/ui/Skeleton'

export function PageLoader() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <Skeleton className="h-4 w-40" />
      <div className="surface-card overflow-hidden p-5">
        <Skeleton className="mb-3 h-6 w-56" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="mb-2 h-3 w-11/12" />
        <Skeleton className="h-3 w-9/12" />
      </div>
    </div>
  )
}
