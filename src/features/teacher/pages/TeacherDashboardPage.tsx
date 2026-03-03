import { Link } from 'react-router'
import { useTeacherDashboard } from '@/features/teacher/hooks/useTeacherDashboard'
import { Spinner } from '@/shared/ui/Spinner'

export function TeacherDashboardPage() {
  const { data, isLoading, error } = useTeacherDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel docente</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen de cursos y alumnos asignados.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-blue-600" label="Cargando panel…" />
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Error al cargar el panel docente.
        </div>
      )}

      {!isLoading && !error && data && data.courses.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No hay cursos asignados.</p>
        </div>
      )}

      {!isLoading && !error && data && data.courses.length > 0 && (
        <div className="space-y-5">
          {data.courses.map((course) => (
            <section
              key={course.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <header className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h2 className="font-semibold text-gray-900">{course.name}</h2>
                <p className="text-xs text-gray-500">{course.students_count} alumno(s)</p>
              </header>

              <ul className="divide-y divide-gray-100">
                {course.students.map((student) => (
                  <li key={student.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-xs text-gray-500">
                        @{student.username} · {student.company_count} empresa(s) ·{' '}
                        {student.journal_entry_count} asiento(s)
                      </p>
                    </div>

                    <Link
                      to={`/teacher/students/${student.id}`}
                      className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
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
