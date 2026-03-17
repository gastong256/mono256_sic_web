export type Role = 'admin' | 'teacher' | 'student'

export interface SelectorCompany {
  id: number
  name: string
  owner_username: string
  is_demo?: boolean
  is_read_only?: boolean
  has_opening_entry?: boolean
  accounting_ready?: boolean
  opening_entry_id?: number | null
}

export interface UserCapabilities {
  can_manage_courses: boolean
  can_manage_visibility: boolean
  can_view_registration_code: boolean
  can_manage_roles: boolean
}

export interface RegistrationCodeInfo {
  code: string
  window_minutes: number
  allow_previous_window: boolean
  valid_from: string
  valid_until: string
}

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
  companies?: SelectorCompany[]
  capabilities?: UserCapabilities
  registration_code?: RegistrationCodeInfo | null
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
