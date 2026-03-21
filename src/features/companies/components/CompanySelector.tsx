import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useAuthenticatedBootstrap } from '@/features/auth/hooks/useAuthenticatedBootstrap'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'

export function CompanySelector() {
  const { accessToken } = useAuthStore()
  const { activeCompanyId, setActiveCompanyId } = useActiveCompanyStore()
  const isAuthenticated = Boolean(accessToken)
  const { data: bootstrap, isLoading } = useAuthenticatedBootstrap()
  const companies = bootstrap?.companies
  const activeCompany =
    companies?.find((company) => company.id === activeCompanyId) ?? companies?.[0] ?? null

  // Keep active company valid after login/user switch/company deletion.
  useEffect(() => {
    if (!companies || companies.length === 0) return

    const hasActive = activeCompanyId !== null && companies.some((c) => c.id === activeCompanyId)
    if (!hasActive) {
      setActiveCompanyId(companies[0].id)
    }
  }, [activeCompanyId, companies, setActiveCompanyId])

  if (!isAuthenticated || isLoading || !companies || companies.length === 0) return null

  const selectorTitle = [activeCompany?.name ?? ''].filter(Boolean).join(' · ')
  const demoIndicator = activeCompany?.is_demo ? (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-[color:rgba(0,104,234,0.18)] bg-[rgba(0,104,234,0.1)] px-2 text-[0.66rem] font-bold tracking-normal whitespace-nowrap text-[var(--brand-700)]">
      Demo
    </span>
  ) : null

  if (companies.length === 1) {
    return (
      <div className="w-full max-w-full min-w-0 flex-none">
        <div
          className="w-full max-w-full overflow-hidden rounded-full border border-[var(--border-strong)] bg-white/95 px-4 py-2 text-left shadow-sm"
          title={selectorTitle}
        >
          <span className="block truncate text-sm leading-none font-bold text-[var(--text-strong)]">
            {companies[0].name}
          </span>
        </div>
        <div className="mt-1 flex h-5 items-center gap-1.5 pr-1 pl-4">
          <span className="text-[0.73rem] font-medium tracking-normal text-[var(--text-muted)]">
            Empresa activa
          </span>
          {demoIndicator}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full min-w-0 flex-none">
      <div className="relative w-full max-w-full">
        <select
          value={activeCompanyId ?? ''}
          onChange={(e) => setActiveCompanyId(Number(e.target.value))}
          className="w-full max-w-full appearance-none overflow-hidden rounded-full border border-[var(--border-strong)] bg-white/95 px-4 py-2 pr-10 text-sm leading-none font-bold text-ellipsis whitespace-nowrap text-[var(--text-strong)] shadow-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
          title={selectorTitle}
          aria-label="Seleccionar empresa activa"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[var(--text-muted)]"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="mt-1 flex h-5 items-center gap-1.5 pr-1 pl-4">
        <span className="text-[0.73rem] font-medium tracking-normal text-[var(--text-muted)]">
          Empresa activa
        </span>
        {demoIndicator}
      </div>
    </div>
  )
}
