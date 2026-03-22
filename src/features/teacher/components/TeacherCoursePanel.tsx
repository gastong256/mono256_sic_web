import { useState } from 'react'
import { Link } from 'react-router'
import { TeacherCourseVisibilityModal } from '@/features/teacher/components/TeacherCourseVisibilityModal'
import type { TeacherCourseOverviewItem } from '@/features/teacher/types/teacher.types'
import { Button } from '@/shared/ui/Button'

type TeacherCoursePanelProps = {
  course: TeacherCourseOverviewItem
  canManageDemoVisibility: boolean
  onOpenEnroll: (course: { id: number; name: string }) => void
  onUnenroll: (courseId: number, studentId: number) => Promise<void>
  isUnenrolling: (courseId: number, studentId: number) => boolean
}

export function TeacherCoursePanel({
  course,
  canManageDemoVisibility,
  onOpenEnroll,
  onUnenroll,
  isUnenrolling,
}: TeacherCoursePanelProps) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  return (
    <>
      <section className="surface-card ui-fade-in overflow-hidden">
        <header className="data-table-head flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
          <div>
            <h2 className="font-semibold text-[var(--text-strong)]">{course.course_name}</h2>
            <p className="muted-text text-xs">
              {course.student_count} alumno(s) · {course.totals.company_count} empresa(s) ·{' '}
              {course.totals.journal_entry_count} asiento(s)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageDemoVisibility && (
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={() => setIsDemoModalOpen(true)}
              >
                Visibilidad del curso
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => onOpenEnroll({ id: course.course_id, name: course.course_name })}
            >
              Enrolar alumno
            </Button>
          </div>
        </header>

        {course.students.length === 0 && (
          <div className="px-4 py-5">
            <p className="muted-text text-sm">No hay alumnos enrolados en este curso.</p>
          </div>
        )}

        {course.students.length > 0 && (
          <ul className="divide-y divide-[var(--border-soft)]">
            {course.students.map((student) => (
              <li key={student.student_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-[linear-gradient(120deg,var(--brand-500),var(--accent-500))] text-xs font-bold text-white">
                    {student.student_full_name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-strong)]">
                      {student.student_full_name}
                    </p>
                    <p className="muted-text text-xs">
                      @{student.student_username} · {student.company_count} empresa(s) ·{' '}
                      {student.journal_entry_count} asiento(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/students/${student.student_id}?courseId=${course.course_id}`}
                    className="rounded-full border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-600)] transition-colors hover:bg-[var(--bg-subtle)]"
                  >
                    Ver detalle
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-[var(--danger-600)] hover:bg-red-50 hover:text-[var(--danger-600)]"
                    isLoading={isUnenrolling(course.course_id, student.student_id)}
                    onClick={() => {
                      void onUnenroll(course.course_id, student.student_id)
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

      <TeacherCourseVisibilityModal
        course={{ id: course.course_id, name: course.course_name }}
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  )
}
