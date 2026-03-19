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
    <header className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="flex items-start gap-3.5">
        {icon && (
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-[linear-gradient(135deg,rgba(0,104,234,0.14),rgba(0,183,195,0.12))] text-[var(--brand-600)] shadow-[0_14px_30px_-24px_rgba(10,29,64,0.8)]">
            <AppIcon name={icon} className="size-6" />
          </span>
        )}
        <div className="space-y-1">
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="muted-text max-w-3xl text-sm leading-6">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
