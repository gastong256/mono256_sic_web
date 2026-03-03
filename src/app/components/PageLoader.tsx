import { Spinner } from '@/shared/ui/Spinner'

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8 text-[var(--brand-500)]" label="Loading page…" />
    </div>
  )
}
