import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherCompanyJournalQueryKey } from '@/features/teacher/hooks/useTeacherCompanyJournalEntries'
import type { CreateJournalEntryPayload } from '@/features/journal/types/journal.types'
import { logger } from '@/shared/lib/logger'

export function useCreateTeacherJournalEntry(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) =>
      teacherApi.createCompanyJournalEntry(companyId, payload),
    onSuccess: async (entry) => {
      logger.info({ message: 'Teacher created journal entry', companyId, entryId: entry.id })
      await queryClient.invalidateQueries({ queryKey: teacherCompanyJournalQueryKey(companyId) })
      await queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] })
    },
  })
}
