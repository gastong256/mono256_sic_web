import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const teacherCompanyJournalQueryKey = (companyId: number) =>
  ['teacher', 'companies', companyId, 'journal'] as const

export function useTeacherCompanyJournalEntries(companyId: number | null) {
  return useQuery({
    queryKey: teacherCompanyJournalQueryKey(companyId ?? 0),
    queryFn: () => teacherApi.companyJournal(companyId!),
    enabled: companyId !== null && companyId > 0,
  })
}
