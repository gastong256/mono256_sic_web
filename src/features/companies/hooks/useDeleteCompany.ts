import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { COMPANIES_QUERY_KEY } from '@/features/companies/hooks/useCompanies'
import { logger } from '@/shared/lib/logger'

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => companiesApi.remove(id),
    onSuccess: async (_, id) => {
      logger.info({ message: 'Empresa eliminada', companyId: id })
      await queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY })
    },
    onError: (error) => {
      logger.error({ message: 'Error al eliminar empresa', error: String(error) })
    },
  })
}
