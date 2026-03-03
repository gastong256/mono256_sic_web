import { useQuery } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'

export const journalEntryQueryKey = (companyId: number, entryId: number) =>
  ['journal', 'entry', companyId, entryId] as const

export function useJournalEntry(companyId: number, entryId: number, enabled: boolean) {
  return useQuery({
    queryKey: journalEntryQueryKey(companyId, entryId),
    queryFn: () => journalApi.get(companyId, entryId),
    enabled: enabled && companyId > 0 && entryId > 0,
  })
}
