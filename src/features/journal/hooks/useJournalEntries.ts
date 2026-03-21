import { useQuery } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'

export const journalEntriesQueryKey = journalQueryKeys.entries
export const journalEntriesPageQueryKey = journalQueryKeys.entriesPage

export function useJournalEntries(page = 1, options?: { enabled?: boolean }) {
  const { activeCompanyId } = useActiveCompanyStore()

  return useQuery({
    queryKey: journalEntriesPageQueryKey(activeCompanyId, page),
    queryFn: () => journalApi.list(activeCompanyId!, page),
    enabled: (options?.enabled ?? true) && activeCompanyId !== null,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
