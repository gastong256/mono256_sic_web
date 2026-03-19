import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalEntriesQueryKey } from '@/features/journal/hooks/useJournalEntries'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { OpeningEntryPayload } from '@/features/companies/types/company.types'

export function useCreateOpeningEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OpeningEntryPayload) =>
      companiesApi.createOpeningEntry(companyId, payload),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.latestSnapshot(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.companyFlat(companyId) }),
        queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(companyId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
      ])
      logger.info({ message: 'Opening entry created', entryId: entry.id, companyId })
    },
    onError: (error) => {
      logger.error({ message: 'Failed to create opening entry', companyId, error })
    },
  })
}
