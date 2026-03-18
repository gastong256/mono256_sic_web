import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalEntriesQueryKey } from '@/features/journal/hooks/useJournalEntries'
import { logger } from '@/shared/lib/logger'
import type { SimplifiedClosingRequest } from '@/features/companies/types/closing.types'

export function useExecuteClosing(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SimplifiedClosingRequest) =>
      companyClosingApi.execute(companyId, payload),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(companyId) }),
        queryClient.invalidateQueries({ queryKey: ['accounts', 'company', companyId] }),
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
