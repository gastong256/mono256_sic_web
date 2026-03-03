import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'

export function CompanySelector() {
  const { accessToken } = useAuthStore()
  const { activeCompanyId, setActiveCompanyId } = useActiveCompanyStore()
  const isAuthenticated = Boolean(accessToken)
  const { data: companies, isLoading } = useCompanies({ enabled: isAuthenticated })

  // Keep active company valid after login/user switch/company deletion.
  useEffect(() => {
    if (!companies || companies.length === 0) return

    const hasActive = activeCompanyId !== null && companies.some((c) => c.id === activeCompanyId)
    if (!hasActive) {
      setActiveCompanyId(companies[0].id)
    }
  }, [activeCompanyId, companies, setActiveCompanyId])

  if (!isAuthenticated || isLoading || !companies || companies.length === 0) return null

  if (companies.length === 1) {
    return (
      <span className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-strong)]">
        Empresa activa: {companies[0].name}
      </span>
    )
  }

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
      Empresa activa
      <select
        value={activeCompanyId ?? ''}
        onChange={(e) => setActiveCompanyId(Number(e.target.value))}
        className="rounded-md border border-[var(--border-strong)] bg-white px-2 py-1 text-sm font-medium text-[var(--text-strong)] shadow-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>
  )
}
