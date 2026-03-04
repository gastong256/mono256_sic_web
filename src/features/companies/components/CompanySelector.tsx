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
      <span className="inline-flex max-w-[16rem] items-center truncate rounded-full border border-[var(--border-soft)] bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--text-strong)]">
        Empresa activa: {companies[0].name}
      </span>
    )
  }

  return (
    <label className="inline-flex max-w-[18rem] items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
      <span className="hidden lg:inline">Empresa activa</span>
      <select
        value={activeCompanyId ?? ''}
        onChange={(e) => setActiveCompanyId(Number(e.target.value))}
        className="max-w-[12rem] truncate rounded-full border border-[var(--border-strong)] bg-white/95 px-3 py-1 text-sm font-semibold text-[var(--text-strong)] shadow-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
        title={companies.find((company) => company.id === activeCompanyId)?.name ?? ''}
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
