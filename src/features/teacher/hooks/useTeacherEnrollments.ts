import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export const teacherAvailableStudentsQueryKey = (
  courseId: number,
  params?: { search?: string; page?: number }
) => teacherQueryKeys.availableStudents(courseId, params)

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
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.courses })
      await queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.availableStudents(variables.courseId),
      })
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.course(variables.courseId) })
    },
  })
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: number; studentId: number }) =>
      teacherApi.unenrollStudent(courseId, studentId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.courses })
      await queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.availableStudents(variables.courseId),
      })
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.course(variables.courseId) })
    },
  })
}
