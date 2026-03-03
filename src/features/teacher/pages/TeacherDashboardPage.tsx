import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTeacherDashboard } from '@/features/teacher/hooks/useTeacherDashboard'
import {
  useEnrollStudent,
  useTeacherAvailableStudents,
  useUnenrollStudent,
} from '@/features/teacher/hooks/useTeacherEnrollments'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/ToastProvider'

function fullName(student: { first_name?: string; last_name?: string; username: string }): string {
  const formatted = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
  return formatted.length > 0 ? formatted : student.username
}

export function TeacherDashboardPage() {
  const { pushToast } = useToast()
  const { data, isLoading, error } = useTeacherDashboard()
  const [courseForEnroll, setCourseForEnroll] = useState<{ id: number; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const availableParams = useMemo(
    () => ({
      search: search.trim() ? search.trim() : undefined,
      page,
    }),
    [search, page]
  )
  const {
    data: availableStudents,
    isLoading: availableLoading,
    error: availableError,
  } = useTeacherAvailableStudents(courseForEnroll?.id ?? 0, availableParams)
  const enrollMutation = useEnrollStudent()
  const unenrollMutation = useUnenrollStudent()

  const totalAvailablePages = useMemo(() => {
    if (!availableStudents) return 1
    const pageSize = availableStudents.results.length || 1
    return Math.max(1, Math.ceil(availableStudents.count / pageSize))
  }, [availableStudents])

  async function handleEnroll(studentId: number) {
    if (!courseForEnroll) return
    try {
      await enrollMutation.mutateAsync({ courseId: courseForEnroll.id, studentId })
      pushToast('Alumno enrolado correctamente.', 'success')
    } catch {
      pushToast('No se pudo enrolar al alumno.', 'error')
    }
  }

  async function handleUnenroll(courseId: number, studentId: number) {
    try {
      await unenrollMutation.mutateAsync({ courseId, studentId })
      pushToast('Alumno desenrolado correctamente.', 'success')
    } catch {
      pushToast('No se pudo desenrolar al alumno.', 'error')
    }
  }

  function openEnrollModal(course: { id: number; name: string }) {
    setCourseForEnroll(course)
    setSearch('')
    setPage(1)
  }

  function closeEnrollModal() {
    setCourseForEnroll(null)
    setSearch('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="teacher"
        title="Panel docente"
        subtitle="Resumen de cursos y alumnos asignados."
      />

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
        <EmptyState icon="teacher" title="No hay cursos asignados" />
      )}

      {!isLoading && !error && data && data.courses.length > 0 && (
        <div className="space-y-5">
          {data.courses.map((course) => (
            <section key={course.id} className="surface-card ui-fade-in overflow-hidden">
              <header className="data-table-head flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3">
                <div>
                  <h2 className="font-semibold text-[var(--text-strong)]">{course.name}</h2>
                  <p className="muted-text text-xs">{course.students_count} alumno(s)</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => openEnrollModal({ id: course.id, name: course.name })}
                >
                  Enrolar alumno
                </Button>
              </header>

              {course.students.length === 0 && (
                <div className="px-4 py-5">
                  <p className="muted-text text-sm">No hay alumnos enrolados en este curso.</p>
                </div>
              )}

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
                        isLoading={
                          unenrollMutation.isPending &&
                          unenrollMutation.variables?.courseId === course.id &&
                          unenrollMutation.variables?.studentId === student.id
                        }
                        onClick={() => {
                          void handleUnenroll(course.id, student.id)
                        }}
                      >
                        Desenrolar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={courseForEnroll !== null}
        onClose={closeEnrollModal}
        title={courseForEnroll ? `Enrolar alumno en ${courseForEnroll.name}` : 'Enrolar alumno'}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Buscar alumno"
            placeholder="Username o nombre"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />

          {availableLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          )}

          {availableError && !availableLoading && (
            <Alert tone="error">No se pudo cargar la lista de alumnos disponibles.</Alert>
          )}

          {!availableLoading &&
            !availableError &&
            availableStudents &&
            availableStudents.results.length === 0 && (
              <EmptyState
                icon="student"
                title="Sin alumnos disponibles"
                description="Todos los alumnos ya estan enrolados en este curso o no hay coincidencias."
                className="py-6"
              />
            )}

          {!availableLoading &&
            !availableError &&
            availableStudents &&
            availableStudents.results.length > 0 && (
              <>
                <ul className="divide-y divide-[var(--border-soft)] rounded-xl border border-[var(--border-soft)]">
                  {availableStudents.results.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-strong)]">
                          {fullName(student)}
                        </p>
                        <p className="muted-text text-xs">@{student.username}</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        isLoading={
                          enrollMutation.isPending &&
                          enrollMutation.variables?.studentId === student.id
                        }
                        onClick={() => {
                          void handleEnroll(student.id)
                        }}
                      >
                        Inscribir
                      </Button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  <p className="muted-text text-xs">
                    Mostrando {availableStudents.results.length} de {availableStudents.count}{' '}
                    alumno(s).
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="muted-text text-xs">
                      Pagina {page} / {totalAvailablePages}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      disabled={page >= totalAvailablePages}
                      onClick={() => setPage((value) => Math.min(totalAvailablePages, value + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
        </div>
      </Modal>
    </div>
  )
}
