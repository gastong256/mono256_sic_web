import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { SetDemoPublicationPayload } from '@/features/companies/types/company.types'

export function useSetDemoPublication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: number
      payload: SetDemoPublicationPayload
    }) => companiesApi.setDemoPublication(companyId, payload),
    onSuccess: async ({ id, is_published }) => {
      logger.info({
        message: 'Publicación de demo actualizada',
        companyId: id,
        isPublished: is_published ?? null,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ])
    },
    onError: (error, variables) => {
      logger.error({
        message: 'Error al actualizar la publicación de la demo',
        companyId: variables.companyId,
        error: String(error),
      })
    },
  })
}
