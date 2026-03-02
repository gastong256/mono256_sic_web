import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { companyAccountsQueryKey } from '@/features/accounts/hooks/useCompanyAccounts'
import { logger } from '@/shared/lib/logger'
import type { UpdateAccountPayload } from '@/features/accounts/types/account.types'

export function useUpdateAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateAccountPayload }) =>
      accountsApi.updateAccount(companyId, accountId, payload),
    onSuccess: async (account) => {
      logger.info({ message: 'Cuenta actualizada', accountId: account.id, companyId })
      await queryClient.invalidateQueries({ queryKey: companyAccountsQueryKey(companyId) })
    },
    onError: (error) => {
      logger.error({ message: 'Error al actualizar cuenta', error: String(error) })
    },
  })
}
