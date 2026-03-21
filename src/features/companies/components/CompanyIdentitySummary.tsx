import type { ReactNode } from 'react'
import type { Company } from '@/features/companies/types/company.types'

interface CompanyIdentitySummaryProps {
  company?: Company | null
  fallbackName?: string
  fallbackDescription: string
  className?: string
  children?: ReactNode
}

export function CompanyIdentitySummary({
  company,
  fallbackName = 'Empresa seleccionada',
  fallbackDescription,
  className = '',
  children,
}: CompanyIdentitySummaryProps) {
  return (
    <section
      className={['space-y-1 border-b border-[var(--border-soft)]/80 pb-3', className].join(' ')}
    >
      <p className="text-lg font-semibold tracking-tight text-[var(--text-strong)] sm:text-xl">
        {company?.name ?? fallbackName}
      </p>
      <p className="muted-text max-w-3xl text-sm sm:text-[0.95rem]">
        {company?.description || fallbackDescription}
      </p>
      {company?.tax_id && (
        <p className="muted-text text-sm sm:text-[0.95rem]">CUIT/CUIL: {company.tax_id}</p>
      )}
      {children}
    </section>
  )
}
