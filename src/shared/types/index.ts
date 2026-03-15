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

export interface AccountLevelConfig {
  account_id: number
  level: 0 | 1
  code: string
  name: string
  visible: boolean
}

export interface AdminRoleUpdatePayload {
  role: Role
}
