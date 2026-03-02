import { Spinner } from '@/shared/ui/Spinner'

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8 text-blue-600" label="Loading page…" />
    </div>
  )
}
