import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const TEACHER_DASHBOARD_QUERY_KEY = ['teacher', 'dashboard'] as const

export function useTeacherDashboard() {
  return useQuery({
    queryKey: TEACHER_DASHBOARD_QUERY_KEY,
    queryFn: teacherApi.dashboard,
    staleTime: 2 * 60 * 1000,
  })
}
