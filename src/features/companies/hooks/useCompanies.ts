import { useQuery } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

interface UseCompaniesOptions {
  enabled?: boolean
}

export function useCompanies(options?: UseCompaniesOptions) {
  return useQuery({
    queryKey: companyQueryKeys.root,
    queryFn: companiesApi.list,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  })
}
