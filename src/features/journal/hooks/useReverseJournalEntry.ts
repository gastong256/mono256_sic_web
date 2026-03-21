import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalApi } from '@/features/journal/api/journal.api'
import { journalEntryQueryKey } from '@/features/journal/hooks/useJournalEntry'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import { logger } from '@/shared/lib/logger'
import type { ReverseJournalEntryPayload } from '@/features/journal/types/journal.types'

export function useReverseJournalEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload?: ReverseJournalEntryPayload }) =>
      journalApi.reverse(companyId, entryId, payload),
    onSuccess: async (entry, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: journalQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({
          queryKey: journalEntryQueryKey(companyId, variables.entryId),
        }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.company(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.closingState(companyId) }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.logicalExercises(companyId) }),
      ])
      logger.info({ message: 'Journal entry reversed', entryId: entry.id })
    },
    onError: (err: unknown) => {
      logger.error({ message: 'Failed to reverse journal entry', error: err })
    },
  })
}
