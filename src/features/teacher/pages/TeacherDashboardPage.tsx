import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  useEnrollStudent,
  useTeacherAvailableStudents,
  useUnenrollStudent,
} from '@/features/teacher/hooks/useTeacherEnrollments'
import { useCreateCourse, useTeacherCoursesList } from '@/features/teacher/hooks/useTeacherCourses'
import { useTeacherCourseCompaniesSummary } from '@/features/teacher/hooks/useTeacherCourseCompaniesSummary'
import { useTeacherCourseJournalEntries } from '@/features/teacher/hooks/useTeacherCourseJournalEntries'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/ToastProvider'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import type { CourseItem } from '@/features/teacher/types/teacher.types'

const AVAILABLE_STUDENTS_PAGE_SIZE = 25

function fullName(student: {
  first_name?: string
  last_name?: string
  full_name?: string
  username: string
}): string {
  const fullNameCandidate =
    'full_name' in student && typeof student.full_name === 'string' ? student.full_name.trim() : ''
  if (fullNameCandidate.length > 0) return fullNameCandidate

  const formatted = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
  return formatted.length > 0 ? formatted : student.username
}

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

function TeacherCoursePanel({
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

export function TeacherDashboardPage() {
  const { user } = useAuthStore()
  const { pushToast } = useToast()
  const { data: courses = [], isLoading, error } = useTeacherCoursesList()
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [createCourseError, setCreateCourseError] = useState<string | null>(null)
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
  const createCourseMutation = useCreateCourse()
  const enrollMutation = useEnrollStudent()
  const unenrollMutation = useUnenrollStudent()

  const totalAvailablePages = useMemo(() => {
    if (!availableStudents) return 1
    return Math.max(1, Math.ceil(availableStudents.count / AVAILABLE_STUDENTS_PAGE_SIZE))
  }, [availableStudents])
  const dashboardErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar el panel docente.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para acceder al panel docente.',
      }),
    [error]
  )
  const availableStudentsErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(availableError, {
        defaultMessage: 'No se pudo cargar la lista de alumnos disponibles.',
        badRequestMessage: 'Parámetros inválidos para buscar alumnos disponibles.',
        forbiddenMessage: 'No tenés permisos para gestionar inscripciones de este curso.',
      }),
    [availableError]
  )

  async function handleEnroll(studentId: number) {
    if (!courseForEnroll) return
    try {
      await enrollMutation.mutateAsync({ courseId: courseForEnroll.id, studentId })
      pushToast('Alumno enrolado correctamente.', 'success')
    } catch (mutationError) {
      pushToast(
        getHttpErrorMessage(mutationError, {
          defaultMessage: 'No se pudo enrolar al alumno.',
          badRequestMessage: 'El alumno no puede inscribirse en este curso.',
          forbiddenMessage: 'No tenés permisos para enrolar alumnos en este curso.',
          notFoundMessage: 'El curso o alumno ya no está disponible.',
        }),
        'error'
      )
    }
  }

  async function handleUnenroll(courseId: number, studentId: number) {
    try {
      await unenrollMutation.mutateAsync({ courseId, studentId })
      pushToast('Alumno desenrolado correctamente.', 'success')
    } catch (mutationError) {
      pushToast(
        getHttpErrorMessage(mutationError, {
          defaultMessage: 'No se pudo desenrolar al alumno.',
          forbiddenMessage: 'No tenés permisos para desenrolar alumnos en este curso.',
          notFoundMessage: 'La inscripción no existe o ya fue eliminada.',
        }),
        'error'
      )
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

  async function handleCreateCourse() {
    const name = newCourseName.trim()
    const code = newCourseCode.trim()

    if (!name) {
      setCreateCourseError('El nombre del curso es obligatorio.')
      return
    }

    try {
      setCreateCourseError(null)
      await createCourseMutation.mutateAsync({
        name,
        ...(code ? { code } : null),
      })
      pushToast('Curso creado correctamente.', 'success')
      setIsCreateCourseOpen(false)
      setNewCourseName('')
      setNewCourseCode('')
    } catch (mutationError) {
      const message = getHttpErrorMessage(mutationError, {
        defaultMessage: 'No se pudo crear el curso.',
        badRequestMessage: 'Revisá el nombre/código del curso e intentá nuevamente.',
        forbiddenMessage: 'No tenés permisos para crear cursos.',
      })
      setCreateCourseError(message)
      pushToast(message, 'error')
    }
  }

  function closeCreateCourseModal() {
    setIsCreateCourseOpen(false)
    setCreateCourseError(null)
    setNewCourseName('')
    setNewCourseCode('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="teacher"
        title="Panel docente"
        subtitle="Resumen de cursos y alumnos asignados."
        actions={
          (user?.role === 'teacher' || user?.role === 'admin') && (
            <Button type="button" onClick={() => setIsCreateCourseOpen(true)}>
              + Nuevo curso
            </Button>
          )
        }
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

      {error && !isLoading && <Alert tone="error">{dashboardErrorMessage}</Alert>}

      {!isLoading && !error && courses.length === 0 && (
        <EmptyState icon="teacher" title="No hay cursos asignados" />
      )}

      {!isLoading && !error && courses.length > 0 && (
        <div className="space-y-5">
          {courses.map((course) => (
            <TeacherCoursePanel
              key={course.id}
              course={course}
              onOpenEnroll={openEnrollModal}
              onUnenroll={handleUnenroll}
              isUnenrolling={(courseId, studentId) =>
                unenrollMutation.isPending &&
                unenrollMutation.variables?.courseId === courseId &&
                unenrollMutation.variables?.studentId === studentId
              }
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateCourseOpen}
        onClose={closeCreateCourseModal}
        title="Crear nuevo curso"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {createCourseError && <Alert tone="error">{createCourseError}</Alert>}
          <Input
            label="Nombre del curso"
            placeholder="Ej: Contabilidad II"
            value={newCourseName}
            onChange={(event) => setNewCourseName(event.target.value)}
          />
          <Input
            label="Codigo (opcional)"
            placeholder="Ej: CONT-II"
            value={newCourseCode}
            onChange={(event) => setNewCourseCode(event.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeCreateCourseModal}>
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={createCourseMutation.isPending}
              onClick={() => {
                void handleCreateCourse()
              }}
            >
              Crear curso
            </Button>
          </div>
        </div>
      </Modal>

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
            <Alert tone="error">{availableStudentsErrorMessage}</Alert>
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
