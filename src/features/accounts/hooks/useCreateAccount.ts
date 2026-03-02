import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { companyAccountsQueryKey } from '@/features/accounts/hooks/useCompanyAccounts'
import { logger } from '@/shared/lib/logger'
import type { CreateAccountPayload } from '@/features/accounts/types/account.types'

export function useCreateAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => accountsApi.createAccount(companyId, payload),
    onSuccess: async (account) => {
      logger.info({ message: 'Cuenta creada', accountId: account.id, companyId })
      await queryClient.invalidateQueries({ queryKey: companyAccountsQueryKey(companyId) })
    },
    onError: (error) => {
      logger.error({ message: 'Error al crear cuenta', error: String(error) })
    },
  })
}
