import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { CreateAccountPayload } from '@/features/accounts/types/account.types'

export function useCreateAccount(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => accountsApi.createAccount(companyId, payload),
    onSuccess: async (account) => {
      logger.info({ message: 'Cuenta creada', accountId: account.id, companyId })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.companyFlat(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
      ])
    },
    onError: (error) => {
      logger.error({ message: 'Error al crear cuenta', error: String(error) })
    },
  })
}
