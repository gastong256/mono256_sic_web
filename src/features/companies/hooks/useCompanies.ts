import { useQuery } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

interface UseCompaniesOptions {
  enabled?: boolean
}

export function useCompanies(options?: UseCompaniesOptions) {
  return useQuery({
    queryKey: companyQueryKeys.list,
    queryFn: companiesApi.list,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
