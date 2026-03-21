import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalApi } from '@/features/journal/api/journal.api'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { CreateJournalEntryPayload } from '@/features/journal/types/journal.types'

export function useCreateJournalEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => journalApi.create(companyId, payload),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: journalQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
      ])
      logger.info({ message: 'Journal entry created', entryId: entry.id })
    },
    onError: (err: unknown) => {
      logger.error({ message: 'Failed to create journal entry', error: err })
    },
  })
}
