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
    return <span className="px-2 text-sm font-medium text-gray-700">{companies[0].name}</span>
  }

  return (
    <select
      value={activeCompanyId ?? ''}
      onChange={(e) => setActiveCompanyId(Number(e.target.value))}
      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    >
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  )
}
