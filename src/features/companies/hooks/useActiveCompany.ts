import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useAuthenticatedBootstrap } from '@/features/auth/hooks/useAuthenticatedBootstrap'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import type { Company } from '@/features/companies/types/company.types'

function normalizeCompanySummary(company: Company | undefined): Company | null {
  return company ?? null
}

export function useActiveCompany(companyIdOverride?: number | null) {
  const { user } = useAuthStore()
  const { activeCompanyId } = useActiveCompanyStore()
  const resolvedCompanyId = companyIdOverride ?? activeCompanyId
  const { data: bootstrap, isLoading: bootstrapLoading } = useAuthenticatedBootstrap()
  const shouldLoadFullCompanies = resolvedCompanyId !== null && !bootstrap?.companies?.length
  const { data: companies = [], isLoading: companiesLoading } = useCompanies({
    enabled: shouldLoadFullCompanies,
  })

  const activeCompany = useMemo(() => {
    if (resolvedCompanyId === null) return null

    const bootstrapCompany = bootstrap?.companies?.find(
      (company) => company.id === resolvedCompanyId
    )
    if (bootstrapCompany) return normalizeCompanySummary(bootstrapCompany as Company)

    return companies.find((company) => company.id === resolvedCompanyId) ?? null
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

  return {
    activeCompanyId: resolvedCompanyId,
    activeCompany,
    canManageOpening,
    canManageClosing,
    canWriteCompany,
    isLoading: bootstrapLoading || companiesLoading,
  }
}
