import { useQuery } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'

export const COMPANIES_QUERY_KEY = ['companies'] as const

export function useCompanies() {
  return useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: companiesApi.list,
  })
}
