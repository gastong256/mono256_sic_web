import type { JournalLine } from '@/features/journal/types/journal.types'

export interface TeacherCompanyItem {
  id: number
  name: string
  tax_id: string
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
  reversal_of_id: number
  reversed_by_id: number | null
  lines: JournalLine[]
}

export interface TeacherCourseJournalEntriesResponse {
  count: number
  next: string | null
  previous: string | null
  results: TeacherCourseJournalEntry[]
}
