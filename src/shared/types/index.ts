export type Role = 'admin' | 'teacher' | 'student'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  role: Role
  course_id?: number | null
  date_joined?: string
}

export interface CourseSummary {
  id: number
  name: string
  teacher_username: string
  students_count: number
}

export interface StudentSummary {
  id: number
  username: string
  full_name: string
  course_id: number
  course_name: string
  company_count: number
  journal_entry_count: number
}

export interface TeacherDashboardResponse {
  courses: Array<
    CourseSummary & {
      students: StudentSummary[]
    }
  >
}

export interface AccountLevelConfig {
  account_id: number
  level: 1 | 2
  code: string
  name: string
  visible: boolean
}

export interface AdminRoleUpdatePayload {
  role: Exclude<Role, 'admin'>
}

export interface ApiError {
  message: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
