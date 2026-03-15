import type {
  TeacherAvailableStudentsParams,
  TeacherJournalFilters,
} from '@/features/teacher/types/teacher.types'

export const teacherQueryKeys = {
  root: ['teacher'] as const,
  courses: ['teacher', 'courses'] as const,
  course: (courseId: number) => ['teacher', 'courses', courseId] as const,
  courseCompaniesSummary: (courseId: number) =>
    ['teacher', 'courses', courseId, 'companies', 'summary'] as const,
  studentCompanies: (courseId: number, studentId: number) =>
    ['teacher', 'courses', courseId, 'students', studentId, 'companies'] as const,
  courseJournalEntries: (courseId: number, params?: TeacherJournalFilters) =>
    [
      'teacher',
      'courses',
      courseId,
      'journal',
      params?.dateFrom ?? null,
      params?.dateTo ?? null,
      params?.studentId ?? null,
      params?.companyId ?? null,
    ] as const,
  studentCompanyJournal: (
    courseId: number,
    studentId: number,
    companyId: number,
    params?: Pick<TeacherJournalFilters, 'dateFrom' | 'dateTo'>
  ) =>
    [
      'teacher',
      'courses',
      courseId,
      'students',
      studentId,
      'companies',
      companyId,
      'journal',
      params?.dateFrom ?? null,
      params?.dateTo ?? null,
    ] as const,
  availableStudents: (courseId: number, params?: TeacherAvailableStudentsParams) =>
    [
      'teacher',
      'students',
      'available',
      courseId,
      params?.search ?? '',
      params?.page ?? 1,
    ] as const,
}
