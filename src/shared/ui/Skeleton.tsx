interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-[skeleton-pulse_1.25s_ease-in-out_infinite] rounded-md bg-[linear-gradient(90deg,#e7eef9_0%,#dfe8f6_50%,#e7eef9_100%)] bg-[length:200%_100%]',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  )
}

export function SkeletonTextRow() {
  return <Skeleton className="h-3 w-full" />
}
