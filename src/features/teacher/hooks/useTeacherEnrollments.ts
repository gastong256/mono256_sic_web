import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'
import type { TeacherAvailableStudentsParams } from '@/features/teacher/types/teacher.types'

export function useTeacherAvailableStudents(
  courseId: number,
  params?: TeacherAvailableStudentsParams
) {
  return useQuery({
    queryKey: teacherQueryKeys.availableStudents(courseId, params),
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.coursesOverview }),
        queryClient.invalidateQueries({
          queryKey: teacherQueryKeys.availableStudents(variables.courseId),
        }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.course(variables.courseId) }),
        queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] }),
      ])
    },
  })
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: number; studentId: number }) =>
      teacherApi.unenrollStudent(courseId, studentId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.coursesOverview }),
        queryClient.invalidateQueries({
          queryKey: teacherQueryKeys.availableStudents(variables.courseId),
        }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.course(variables.courseId) }),
        queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] }),
      ])
    },
  })
}
