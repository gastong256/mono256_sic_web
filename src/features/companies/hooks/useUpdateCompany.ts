import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { COMPANIES_QUERY_KEY } from '@/features/companies/hooks/useCompanies'
import { logger } from '@/shared/lib/logger'
import type { UpdateCompanyPayload } from '@/features/companies/types/company.types'

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCompanyPayload }) =>
      companiesApi.update(id, payload),
    onSuccess: async (company) => {
      logger.info({ message: 'Empresa actualizada', companyId: company.id })
      await queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY })
    },
    onError: (error) => {
      logger.error({ message: 'Error al actualizar empresa', error: String(error) })
    },
  })
}
