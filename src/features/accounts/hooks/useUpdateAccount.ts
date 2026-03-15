import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { UpdateAccountPayload } from '@/features/accounts/types/account.types'

export function useUpdateAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: UpdateAccountPayload }) =>
      accountsApi.updateAccount(companyId, accountId, payload),
    onSuccess: async (account) => {
      logger.info({ message: 'Cuenta actualizada', accountId: account.id, companyId })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.companyFlat(companyId) }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al actualizar cuenta', error: String(error) })
    },
  })
}
