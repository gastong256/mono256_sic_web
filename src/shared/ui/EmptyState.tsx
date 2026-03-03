import type { ReactNode } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import type { AppIconName } from '@/shared/ui/AppIcon'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  icon?: AppIconName
}

export function EmptyState({ title, description, action, className = '', icon }: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-xl border-2 border-dashed border-[var(--border-soft)] py-12 text-center',
        className,
      ].join(' ')}
    >
      {icon && (
        <span className="glass-panel mb-3 inline-flex size-10 items-center justify-center rounded-xl text-[var(--brand-600)]">
          <AppIcon name={icon} className="size-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-[var(--text-strong)]">{title}</p>
      {description && <p className="muted-text mx-auto mt-1 max-w-xl text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
