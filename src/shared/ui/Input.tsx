import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = inputId ? `${inputId}-error` : undefined

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[var(--text-strong)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={[
            'rounded-xl border px-3 py-2 text-sm transition-all duration-200',
            'bg-white/96 shadow-[inset_0_1px_0_rgb(255_255_255_/_85%)] placeholder:text-[var(--text-muted)]',
            'focus:ring-2 focus:outline-none',
            error
              ? 'border-[var(--danger-500)] focus:border-[var(--danger-500)] focus:ring-[var(--danger-500)]'
              : 'border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-[var(--brand-500)]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-[var(--danger-600)]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
