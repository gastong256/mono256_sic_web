import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-xl border-2 border-dashed border-[var(--border-soft)] py-12 text-center',
        className,
      ].join(' ')}
    >
      <p className="text-sm font-semibold text-[var(--text-strong)]">{title}</p>
      {description && <p className="muted-text mx-auto mt-1 max-w-xl text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
