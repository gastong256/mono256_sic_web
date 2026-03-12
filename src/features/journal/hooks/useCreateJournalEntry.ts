import { useMutation, useQueryClient } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { journalEntriesQueryKey } from '@/features/journal/hooks/useJournalEntries'
import { logger } from '@/shared/lib/logger'
import type { CreateJournalEntryPayload } from '@/features/journal/types/journal.types'

export function useCreateJournalEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => journalApi.create(companyId, payload),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(companyId) }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ])
      logger.info({ message: 'Journal entry created', entryId: entry.id })
    },
    onError: (err: unknown) => {
      logger.error({ message: 'Failed to create journal entry', error: err })
    },
  })
}
