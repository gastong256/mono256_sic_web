export const teacherQueryKeys = {
  root: ['teacher'] as const,
  courses: ['teacher', 'courses'] as const,
  course: (courseId: number) => ['teacher', 'courses', courseId] as const,
  courseCompanies: (courseId: number) => ['teacher', 'courses', courseId, 'companies'] as const,
  courseCompaniesSummary: (courseId: number) =>
    ['teacher', 'courses', courseId, 'companies', 'summary'] as const,
  courseJournalEntries: (
    courseId: number,
    params?: { dateFrom?: string; dateTo?: string; studentId?: number; companyId?: number }
  ) =>
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
  availableStudents: (courseId: number, params?: { search?: string; page?: number }) =>
    [
      'teacher',
      'students',
      'available',
      courseId,
      params?.search ?? '',
      params?.page ?? 1,
    ] as const,
}
