import type { JournalLine } from '@/features/journal/types/journal.types'

export interface TeacherCompanyItem {
  id: number
  name: string
  tax_id: string | null
  is_demo?: boolean
  is_read_only?: boolean
  viewer_can_write?: boolean
  is_published?: boolean
  demo_slug?: string | null
  has_opening_entry?: boolean
  accounting_ready?: boolean
  opening_entry_id?: number | null
  created_at: string
}

export interface TeacherCourseOverviewStudent {
  student_id: number
  student_username: string
  student_full_name: string
  company_count: number
  journal_entry_count: number
}

export interface TeacherCourseOverviewItem {
  course_id: number
  course_name: string
  course_code: string | null
  teacher_id: number
  teacher_username: string
  student_count: number
  totals: {
    company_count: number
    journal_entry_count: number
  }
  students: TeacherCourseOverviewStudent[]
}

export interface TeacherCourseDemoCompany {
  company_id: number
  company_name: string
  is_demo: boolean
  is_read_only: boolean
  is_published: boolean
  demo_slug: string | null
  is_visible: boolean
  account_count: number
  journal_entry_count: number
}

export interface TeacherCourseDemoCompaniesResponse {
  course_id: number
  course_name: string
  demo_companies: TeacherCourseDemoCompany[]
}

export interface TeacherCourseSharedCompany {
  company_id: number
  company_name: string
  owner_id: number | null
  owner_username: string
  is_demo: boolean
  is_read_only: boolean
  is_published: boolean
  demo_slug: string | null
  is_visible: boolean
  account_count: number
  journal_entry_count: number
}

export interface TeacherCourseSharedCompaniesResponse {
  course_id: number
  course_name: string
  shared_companies: TeacherCourseSharedCompany[]
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

export interface TeacherStudentContextCompany {
  id: number
  name: string
  tax_id: string | null
  account_count: number
  journal_entry_count: number
  last_entry_date: string | null
  is_demo?: boolean
  is_read_only?: boolean
  viewer_can_write?: boolean
  is_published?: boolean
  demo_slug?: string | null
  has_opening_entry?: boolean
  accounting_ready?: boolean
  opening_entry_id?: number | null
  books_closed_until: string | null
  created_at: string
  updated_at: string
}

export interface TeacherStudentContextResponse {
  student: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
    course_id: number | null
    course_name: string
  }
  companies: TeacherStudentContextCompany[]
  selected_company_id: number | null
  journal_entries: TeacherCourseJournalEntry[]
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

export interface TeacherCourseVisibilityPayload {
  is_visible: boolean
}

export type TeacherCourseDemoVisibilityPayload = TeacherCourseVisibilityPayload

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
