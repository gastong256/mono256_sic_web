import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { SimplifiedClosingRequest } from '@/features/companies/types/closing.types'

export function useExecuteClosing(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SimplifiedClosingRequest) =>
      companyClosingApi.execute(companyId, payload),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({
          queryKey: companyQueryKeys.currentBalancesRoot(companyId),
        }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.latestSnapshot(companyId) }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: journalQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.companyFlat(companyId) }),
      ])
      logger.info({
        message: 'Closing executed',
        companyId,
        closingDate: response.closing_date,
        createdEntries: response.created_entries.length,
      })
    },
    onError: (error) => {
      logger.error({ message: 'Failed to execute closing', companyId, error })
    },
  })
}
