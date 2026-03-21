import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useAuthenticatedBootstrap } from '@/features/auth/hooks/useAuthenticatedBootstrap'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { getCompanyAccountingBlockMessage } from '@/features/companies/lib/companyAccounting'
import type { Company } from '@/features/companies/types/company.types'

function normalizeCompanySummary(company: Company | undefined): Company | null {
  return company ?? null
}

export function useActiveCompany(companyIdOverride?: number | null) {
  const { user } = useAuthStore()
  const { activeCompanyId } = useActiveCompanyStore()
  const resolvedCompanyId = companyIdOverride ?? activeCompanyId
  const { data: bootstrap, isLoading: bootstrapLoading } = useAuthenticatedBootstrap()
  const needsFullCompanyData = companyIdOverride !== undefined && companyIdOverride !== null
  const shouldLoadFullCompanies =
    resolvedCompanyId !== null && (needsFullCompanyData || !bootstrap?.companies?.length)
  const { data: companies = [], isLoading: companiesLoading } = useCompanies({
    enabled: shouldLoadFullCompanies,
  })

  const activeCompany = useMemo(() => {
    if (resolvedCompanyId === null) return null

    const fullCompany = companies.find((company) => company.id === resolvedCompanyId)
    if (fullCompany) return fullCompany

    const bootstrapCompany = bootstrap?.companies?.find(
      (company) => company.id === resolvedCompanyId
    )
    if (bootstrapCompany) return normalizeCompanySummary(bootstrapCompany as Company)

    return null
  }, [bootstrap?.companies, companies, resolvedCompanyId])

  const canManageOpening = useMemo(() => {
    if (!activeCompany || !user) return false
    if (activeCompany.is_read_only) return false
    return user.role === 'admin' || activeCompany.owner_username === user.username
  }, [activeCompany, user])

  const canManageClosing = useMemo(() => {
    if (!activeCompany || !user) return false
    if (activeCompany.is_read_only) return false
    return user.role === 'admin' || activeCompany.owner_username === user.username
  }, [activeCompany, user])

  const canWriteCompany = useMemo(() => {
    if (!activeCompany) return false
    return activeCompany.is_read_only !== true
  }, [activeCompany])

  const isAccountingReady = activeCompany?.accounting_ready !== false
  const isReadOnly = activeCompany?.is_read_only === true
  const booksClosedUntil = activeCompany?.books_closed_until ?? null
  const accountingBlockMessage =
    activeCompany && (!isAccountingReady || isReadOnly)
      ? getCompanyAccountingBlockMessage(activeCompany)
      : null

  return {
    activeCompanyId: resolvedCompanyId,
    activeCompany,
    canManageOpening,
    canManageClosing,
    canWriteCompany,
    isAccountingReady,
    isReadOnly,
    booksClosedUntil,
    accountingBlockMessage,
    isLoading: bootstrapLoading || companiesLoading,
  }
}
