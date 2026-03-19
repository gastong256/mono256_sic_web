import { useQuery } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { journalQueryKeys } from '@/features/journal/hooks/journalQueryKeys'

export const journalEntriesQueryKey = journalQueryKeys.entries

export function useJournalEntries(options?: { enabled?: boolean }) {
  const { activeCompanyId } = useActiveCompanyStore()

  return useQuery({
    queryKey: journalEntriesQueryKey(activeCompanyId),
    queryFn: () => journalApi.list(activeCompanyId!),
    enabled: (options?.enabled ?? true) && activeCompanyId !== null,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
