import { useQuery } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'

export const journalEntryQueryKey = journalQueryKeys.entry

export function useJournalEntry(companyId: number, entryId: number, enabled: boolean) {
  return useQuery({
    queryKey: journalEntryQueryKey(companyId, entryId),
    queryFn: () => journalApi.get(companyId, entryId),
    enabled: enabled && companyId > 0 && entryId > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
