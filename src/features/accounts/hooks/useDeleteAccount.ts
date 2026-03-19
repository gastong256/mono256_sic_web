import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'

export function useDeleteAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accountId: number) => accountsApi.deleteAccount(companyId, accountId),
    onSuccess: async (_, accountId) => {
      logger.info({ message: 'Cuenta eliminada', accountId, companyId })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.companyFlat(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al eliminar cuenta', error: String(error) })
    },
  })
}
