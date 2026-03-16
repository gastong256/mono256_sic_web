import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export function useTeacherStudentContext(
  studentId: number,
  params?: { companyId?: number | null; entriesLimit?: number }
) {
  const companyId = params?.companyId ?? null
  const entriesLimit = params?.entriesLimit ?? 25

  return useQuery({
    queryKey: teacherQueryKeys.studentContext(studentId, companyId, entriesLimit),
    queryFn: () =>
      teacherApi.studentContext(studentId, {
        ...(companyId ? { companyId } : null),
        entriesLimit,
      }),
    enabled: studentId > 0,
    placeholderData: (previousData) => previousData,
  })
}
