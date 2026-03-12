import { useMutation, useQueryClient } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { journalEntriesQueryKey } from '@/features/journal/hooks/useJournalEntries'
import { journalEntryQueryKey } from '@/features/journal/hooks/useJournalEntry'
import { logger } from '@/shared/lib/logger'
import type { ReverseJournalEntryPayload } from '@/features/journal/types/journal.types'

export function useReverseJournalEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload?: ReverseJournalEntryPayload }) =>
      journalApi.reverse(companyId, entryId, payload),
    onSuccess: async (entry, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(companyId) }),
        queryClient.invalidateQueries({
          queryKey: journalEntryQueryKey(companyId, variables.entryId),
        }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ])
      logger.info({ message: 'Journal entry reversed', entryId: entry.id })
    },
    onError: (err: unknown) => {
      logger.error({ message: 'Failed to reverse journal entry', error: err })
    },
  })
}
