import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const teacherStudentCompaniesQueryKey = (studentId: number) =>
  ['teacher', 'students', studentId, 'companies'] as const

export function useTeacherStudentCompanies(studentId: number) {
  return useQuery({
    queryKey: teacherStudentCompaniesQueryKey(studentId),
    queryFn: () => teacherApi.studentCompanies(studentId),
    enabled: studentId > 0,
  })
}
