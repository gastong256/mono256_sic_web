import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { companyAccountsQueryKey } from '@/features/accounts/hooks/useCompanyAccounts'
import { logger } from '@/shared/lib/logger'

export function useDeleteAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accountId: number) => accountsApi.deleteAccount(companyId, accountId),
    onSuccess: async (_, accountId) => {
      logger.info({ message: 'Cuenta eliminada', accountId, companyId })
      await queryClient.invalidateQueries({ queryKey: companyAccountsQueryKey(companyId) })
    },
    onError: (error) => {
      logger.error({ message: 'Error al eliminar cuenta', error: String(error) })
    },
  })
}
