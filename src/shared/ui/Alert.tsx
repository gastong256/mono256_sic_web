import type { ReactNode } from 'react'

type AlertTone = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  tone?: AlertTone
  children: ReactNode
  className?: string
}

const toneClasses: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-[var(--danger-600)]',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export function Alert({ tone = 'info', children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={['rounded-lg border px-4 py-3 text-sm', toneClasses[tone], className].join(' ')}
    >
      {children}
    </div>
  )
}
