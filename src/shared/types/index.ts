export interface User {
  id: string
  email: string
  name: string
  username: string
  is_staff: boolean
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
