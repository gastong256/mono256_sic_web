import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '@/shared/ui/Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-[linear-gradient(135deg,var(--brand-500),var(--brand-600))] text-white shadow-[0_12px_22px_-14px_rgba(0,104,234,0.8)] hover:brightness-105 focus-visible:ring-[var(--brand-500)]',
  secondary:
    'border border-[var(--border-strong)] bg-white text-[var(--text-strong)] hover:bg-[var(--bg-subtle)] focus-visible:ring-[var(--brand-500)]',
  danger:
    'border border-transparent bg-[linear-gradient(135deg,var(--danger-500),var(--danger-600))] text-white hover:brightness-105 focus-visible:ring-[var(--danger-500)]',
  ghost:
    'border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-strong)] focus-visible:ring-[var(--brand-500)]',
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold tracking-[0.01em]',
        'transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
      disabled={disabled ?? isLoading}
      aria-disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 size-4" label="Loading" />}
      {children}
    </button>
  )
}
