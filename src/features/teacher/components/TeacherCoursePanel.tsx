import { useMemo } from 'react'
import { Link } from 'react-router'
import { useTeacherCourseCompaniesSummary } from '@/features/teacher/hooks/useTeacherCourseCompaniesSummary'
import { useTeacherCourseJournalEntries } from '@/features/teacher/hooks/useTeacherCourseJournalEntries'
import type { CourseItem } from '@/features/teacher/types/teacher.types'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'

function buildStudentJournalCountMap(entries: Array<{ student_id: number }>): Map<number, number> {
  const countMap = new Map<number, number>()
  entries.forEach((entry) => {
    countMap.set(entry.student_id, (countMap.get(entry.student_id) ?? 0) + 1)
  })
  return countMap
}

type TeacherCoursePanelProps = {
  course: CourseItem
  onOpenEnroll: (course: { id: number; name: string }) => void
  onUnenroll: (courseId: number, studentId: number) => Promise<void>
  isUnenrolling: (courseId: number, studentId: number) => boolean
}

export function TeacherCoursePanel({
  course,
  onOpenEnroll,
  onUnenroll,
  isUnenrolling,
}: TeacherCoursePanelProps) {
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useTeacherCourseCompaniesSummary(course.id)
  const {
    data: journalEntries = [],
    isLoading: journalLoading,
    error: journalError,
  } = useTeacherCourseJournalEntries(course.id)

  const journalCounts = useMemo(() => buildStudentJournalCountMap(journalEntries), [journalEntries])
  const students = useMemo(
    () =>
      (summary?.students ?? []).map((student) => ({
        id: student.student_id,
        username: student.student_username,
        full_name: student.student_full_name,
        company_count: student.companies.length,
        journal_entry_count: journalError ? null : (journalCounts.get(student.student_id) ?? 0),
      })),
    [journalCounts, journalError, summary?.students]
  )

  const summaryErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(summaryError, {
        defaultMessage: 'No se pudo cargar el resumen de empresas del curso.',
        forbiddenMessage: 'No tenés permisos para ver este curso.',
        notFoundMessage: 'El curso ya no está disponible.',
      }),
    [summaryError]
  )
  const journalErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(journalError, {
        defaultMessage: 'No se pudieron cargar los asientos del curso.',
        badRequestMessage: 'Los filtros del curso son inválidos.',
        forbiddenMessage: 'No tenés permisos para ver los asientos de este curso.',
        notFoundMessage: 'El curso ya no está disponible.',
      }),
    [journalError]
  )

  return (
    <section className="surface-card ui-fade-in overflow-hidden">
      <header className="data-table-head flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[var(--text-strong)]">{course.name}</h2>
          <p className="muted-text text-xs">
            {summary?.students.length ?? course.student_count ?? 0} alumno(s)
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => onOpenEnroll({ id: course.id, name: course.name })}
        >
          Enrolar alumno
        </Button>
      </header>

      {summaryLoading && !summary && (
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {summaryError && !summaryLoading && !summary && (
        <div className="p-4">
          <Alert tone="error">{summaryErrorMessage}</Alert>
        </div>
      )}

      {!summaryLoading && !summaryError && summary && students.length === 0 && (
        <div className="px-4 py-5">
          <p className="muted-text text-sm">No hay alumnos enrolados en este curso.</p>
        </div>
      )}

      {summary && journalError && (
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <Alert tone="warning">{journalErrorMessage}</Alert>
        </div>
      )}

      {summary && journalLoading && !journalError && (
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <p className="muted-text text-xs">Actualizando conteo de asientos del curso…</p>
        </div>
      )}

      {summary && students.length > 0 && (
        <ul className="divide-y divide-[var(--border-soft)]">
          {students.map((student) => (
            <li key={student.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-[linear-gradient(120deg,var(--brand-500),var(--accent-500))] text-xs font-bold text-white">
                  {student.full_name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-[var(--text-strong)]">{student.full_name}</p>
                  <p className="muted-text text-xs">
                    @{student.username} · {student.company_count} empresa(s) ·{' '}
                    {student.journal_entry_count === null
                      ? 'asientos no disponibles'
                      : `${student.journal_entry_count} asiento(s)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/teacher/students/${student.id}?courseId=${course.id}`}
                  className="rounded-full border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-600)] transition-colors hover:bg-[var(--bg-subtle)]"
                >
                  Ver detalle
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-1.5 text-xs text-[var(--danger-600)] hover:bg-red-50 hover:text-[var(--danger-600)]"
                  isLoading={isUnenrolling(course.id, student.id)}
                  onClick={() => {
                    void onUnenroll(course.id, student.id)
                  }}
                >
                  Desenrolar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
