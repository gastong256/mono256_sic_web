export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  role?: string
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
