import { Link } from 'react-router'
import { useTeacherDashboard } from '@/features/teacher/hooks/useTeacherDashboard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

export function TeacherDashboardPage() {
  const { data, isLoading, error } = useTeacherDashboard()

  return (
    <div className="space-y-6">
      <PageHeader title="Panel docente" subtitle="Resumen de cursos y alumnos asignados." />

      {isLoading && (
        <div className="space-y-4 py-2">
          {[1, 2].map((row) => (
            <div key={row} className="surface-card overflow-hidden">
              <div className="border-b border-[var(--border-soft)] p-4">
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && <Alert tone="error">Error al cargar el panel docente.</Alert>}

      {!isLoading && !error && data && data.courses.length === 0 && (
        <EmptyState title="No hay cursos asignados" />
      )}

      {!isLoading && !error && data && data.courses.length > 0 && (
        <div className="space-y-5">
          {data.courses.map((course) => (
            <section key={course.id} className="surface-card ui-fade-in overflow-hidden">
              <header className="data-table-head border-b border-[var(--border-soft)] px-4 py-3">
                <h2 className="font-semibold text-[var(--text-strong)]">{course.name}</h2>
                <p className="muted-text text-xs">{course.students_count} alumno(s)</p>
              </header>

              <ul className="divide-y divide-[var(--border-soft)]">
                {course.students.map((student) => (
                  <li key={student.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-full bg-[linear-gradient(120deg,var(--brand-500),var(--accent-500))] text-xs font-bold text-white">
                        {student.full_name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--text-strong)]">
                          {student.full_name}
                        </p>
                        <p className="muted-text text-xs">
                          @{student.username} · {student.company_count} empresa(s) ·{' '}
                          {student.journal_entry_count} asiento(s)
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/teacher/students/${student.id}?courseId=${course.id}`}
                      className="rounded-full border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-600)] transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      Ver detalle
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
