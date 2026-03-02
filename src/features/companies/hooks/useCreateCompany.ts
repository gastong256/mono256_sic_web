import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { COMPANIES_QUERY_KEY } from '@/features/companies/hooks/useCompanies'
import { logger } from '@/shared/lib/logger'

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: async (company) => {
      logger.info({ message: 'Empresa creada', companyId: company.id, name: company.name })
      await queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY })
    },
    onError: (error) => {
      logger.error({ message: 'Error al crear empresa', error: String(error) })
    },
  })
}
