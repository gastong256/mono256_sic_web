import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/features/companies/api/companies.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { journalEntriesQueryKey } from '@/features/journal/hooks/useJournalEntries'
import { logger } from '@/shared/lib/logger'
import type { OpeningEntryPayload } from '@/features/companies/types/company.types'

export function useCreateOpeningEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OpeningEntryPayload) =>
      companiesApi.createOpeningEntry(companyId, payload),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts', 'company', companyId] }),
        queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(companyId) }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ])
      logger.info({ message: 'Opening entry created', entryId: entry.id, companyId })
    },
    onError: (error) => {
      logger.error({ message: 'Failed to create opening entry', companyId, error })
    },
  })
}
