import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { TEACHER_DASHBOARD_QUERY_KEY } from '@/features/teacher/hooks/useTeacherDashboard'

export const teacherAvailableStudentsQueryKey = (
  courseId: number,
  params?: { search?: string; page?: number }
) =>
  ['teacher', 'students', 'available', courseId, params?.search ?? '', params?.page ?? 1] as const

export function useTeacherAvailableStudents(
  courseId: number,
  params?: { search?: string; page?: number }
) {
  return useQuery({
    queryKey: teacherAvailableStudentsQueryKey(courseId, params),
    queryFn: () => teacherApi.availableStudents(courseId, params),
    enabled: courseId > 0,
    staleTime: 30_000,
  })
}

export function useEnrollStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: number; studentId: number }) =>
      teacherApi.enrollStudent(courseId, studentId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: TEACHER_DASHBOARD_QUERY_KEY })
      await queryClient.invalidateQueries({
        queryKey: ['teacher', 'students', 'available', variables.courseId],
      })
      await queryClient.invalidateQueries({ queryKey: ['teacher', 'courses', variables.courseId] })
    },
  })
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: number; studentId: number }) =>
      teacherApi.unenrollStudent(courseId, studentId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: TEACHER_DASHBOARD_QUERY_KEY })
      await queryClient.invalidateQueries({
        queryKey: ['teacher', 'students', 'available', variables.courseId],
      })
      await queryClient.invalidateQueries({ queryKey: ['teacher', 'courses', variables.courseId] })
    },
  })
}
