import type { ReactNode } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import type { AppIconName } from '@/shared/ui/AppIcon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  icon?: AppIconName
}

export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="glass-panel mt-1 inline-flex size-10 items-center justify-center rounded-xl text-[var(--brand-600)]">
            <AppIcon name={icon} className="size-5" />
          </span>
        )}
        <div>
          <p className="section-kicker">SIC</p>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="muted-text mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
