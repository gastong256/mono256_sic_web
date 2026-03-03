import { useQuery } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'

export const COMPANIES_QUERY_KEY = ['companies'] as const

interface UseCompaniesOptions {
  enabled?: boolean
}

export function useCompanies(options?: UseCompaniesOptions) {
  return useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: companiesApi.list,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  })
}
