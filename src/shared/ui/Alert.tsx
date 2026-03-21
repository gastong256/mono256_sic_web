import type { ReactNode } from 'react'
import { getSemanticAlertClassName } from '@/shared/ui/semanticTones'

type AlertTone = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  tone?: AlertTone
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'rounded-lg border px-4 py-3 text-sm',
        getSemanticAlertClassName(tone),
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
