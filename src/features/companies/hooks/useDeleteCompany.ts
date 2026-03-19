import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { logger } from '@/shared/lib/logger'

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => companiesApi.remove(id),
    onSuccess: async (_, id) => {
      logger.info({ message: 'Empresa eliminada', companyId: id })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.root }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al eliminar empresa', error: String(error) })
    },
  })
}
