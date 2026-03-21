import type { ReactNode } from 'react'
import type { AppIconName } from '@/shared/ui/AppIcon'
import type { Company } from '@/features/companies/types/company.types'
import { getCompanyAccountingBlockMessage } from '@/features/companies/lib/companyAccounting'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'

interface CompanyPendingOpeningStateProps {
  company: Company | null
  icon: AppIconName
  action?: ReactNode
  className?: string
}

export function CompanyPendingOpeningState({
  company,
  icon,
  action,
  className,
}: CompanyPendingOpeningStateProps) {
  if (company?.accounting_ready !== false) return null

  return (
    <EmptyState
      icon={icon}
      title="Pendiente de apertura contable"
      description={getCompanyAccountingBlockMessage(company)}
      action={action}
      className={className}
    />
  )
}

interface CompanyBooksClosedAlertProps {
  booksClosedUntil?: string | null
  children?: ReactNode
}

export function CompanyBooksClosedAlert({
  booksClosedUntil,
  children,
}: CompanyBooksClosedAlertProps) {
  if (!booksClosedUntil) return null

  return (
    <Alert tone="info">
      Los libros están cerrados hasta <strong>{booksClosedUntil}</strong>.{children}
    </Alert>
  )
}
