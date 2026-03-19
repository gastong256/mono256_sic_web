import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useAuthenticatedBootstrap } from '@/features/auth/hooks/useAuthenticatedBootstrap'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { getCompanyStatusLabels } from '@/features/companies/lib/companyAccounting'

export function CompanySelector() {
  const { accessToken } = useAuthStore()
  const { activeCompanyId, setActiveCompanyId } = useActiveCompanyStore()
  const isAuthenticated = Boolean(accessToken)
  const { data: bootstrap, isLoading } = useAuthenticatedBootstrap()
  const companies = bootstrap?.companies

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
    const labels = getCompanyStatusLabels(companies[0])
    return (
      <div className="flex max-w-[16rem] flex-col">
        <span className="inline-flex items-center truncate rounded-full border border-[var(--border-soft)] bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--text-strong)]">
          Empresa activa: {companies[0].name}
        </span>
        {labels.length > 0 && (
          <span className="mt-1 truncate text-[11px] font-semibold text-[var(--text-muted)]">
            {labels.join(' · ')}
          </span>
        )}
        {companies[0].is_demo && companies[0].demo_slug && (
          <span className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
            Demo: {companies[0].demo_slug}
          </span>
        )}
      </div>
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
