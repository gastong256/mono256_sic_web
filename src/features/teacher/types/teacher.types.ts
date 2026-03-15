import type { JournalLine } from '@/features/journal/types/journal.types'

export interface TeacherCompanyItem {
  id: number
  name: string
  tax_id: string | null
  created_at: string
}

export interface TeacherStudentCompanies {
  student_id: number
  student_username: string
  student_full_name: string
  companies: TeacherCompanyItem[]
}

export interface TeacherCourseCompaniesResponse {
  course_id: number
  course_name: string
  students: TeacherStudentCompanies[]
}

export interface TeacherCourseJournalEntry {
  id: number
  entry_number: number
  date: string
  description: string
  source_type: string
  source_ref: string
  company_id: number
  company_name: string
  student_id: number
  student_username: string
  created_by: string
  reversal_of_id: number | null
  reversed_by_id: number | null
  lines: JournalLine[]
}

export interface TeacherCourseJournalEntriesResponse {
  count: number
  next: string | null
  previous: string | null
  entries: TeacherCourseJournalEntry[]
}

export interface TeacherAvailableStudent {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
}

export interface TeacherAvailableStudentsResponse {
  count: number
  next: string | null
  previous: string | null
  results: TeacherAvailableStudent[]
}

export interface TeacherAvailableStudentsParams {
  search?: string
  page?: number
}

export interface TeacherJournalFilters {
  dateFrom?: string
  dateTo?: string
  studentId?: number
  companyId?: number
}

export interface CourseCreatePayload {
  name: string
  code?: string
  teacher_id?: number
}

export interface CourseItem {
  id: number
  name: string
  code?: string
  teacher_id?: number | null
  teacher_username?: string
  student_count?: number
  created_at?: string
  updated_at?: string
}
