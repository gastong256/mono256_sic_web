import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { logger } from '@/shared/lib/logger'

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: async (company) => {
      logger.info({ message: 'Empresa creada', companyId: company.id, name: company.name })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.root }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al crear empresa', error: String(error) })
    },
  })
}
