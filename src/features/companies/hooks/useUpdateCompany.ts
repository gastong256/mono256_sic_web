import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { UpdateCompanyPayload } from '@/features/companies/types/company.types'

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCompanyPayload }) =>
      companiesApi.update(id, payload),
    onSuccess: async (company) => {
      logger.info({ message: 'Empresa actualizada', companyId: company.id })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al actualizar empresa', error: String(error) })
    },
  })
}
