import { useQuery } from '@tanstack/react-query'
import { journalApi } from '@/features/journal/api/journal.api'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'

export const journalEntriesQueryKey = (companyId: number | null) =>
  ['journal', 'entries', companyId] as const

export function useJournalEntries() {
  const { activeCompanyId } = useActiveCompanyStore()

  return useQuery({
    queryKey: journalEntriesQueryKey(activeCompanyId),
    queryFn: () => journalApi.list(activeCompanyId!),
    enabled: activeCompanyId !== null,
  })
}
