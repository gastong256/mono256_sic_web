import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const teacherStudentCompaniesQueryKey = (courseId: number, studentId: number) =>
  ['teacher', 'courses', courseId, 'students', studentId, 'companies'] as const

export function useTeacherStudentCompanies(courseId: number, studentId: number) {
  return useQuery({
    queryKey: teacherStudentCompaniesQueryKey(courseId, studentId),
    queryFn: () => teacherApi.studentCompanies(courseId, studentId),
    enabled: courseId > 0 && studentId > 0,
  })
}
