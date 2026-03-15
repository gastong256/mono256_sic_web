import type {
  TeacherAvailableStudent,
  TeacherAvailableStudentsResponse,
} from '@/features/teacher/types/teacher.types'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { Skeleton } from '@/shared/ui/Skeleton'

function fullName(student: TeacherAvailableStudent): string {
  const fullNameCandidate = student.full_name.trim()
  if (fullNameCandidate.length > 0) return fullNameCandidate

  const formatted = `${student.first_name} ${student.last_name}`.trim()
  return formatted.length > 0 ? formatted : student.username
}

type TeacherEnrollStudentModalProps = {
  availableStudents: TeacherAvailableStudentsResponse | undefined
  course: { id: number; name: string } | null
  errorMessage: string
  hasError: boolean
  isLoading: boolean
  isOpen: boolean
  isSubmittingStudent: (studentId: number) => boolean
  onClose: () => void
  onEnroll: (studentId: number) => void
  onNextPage: () => void
  onPreviousPage: () => void
  onSearchChange: (value: string) => void
  page: number
  search: string
  totalPages: number
}

export function TeacherEnrollStudentModal({
  availableStudents,
  course,
  errorMessage,
  hasError,
  isLoading,
  isOpen,
  isSubmittingStudent,
  onClose,
  onEnroll,
  onNextPage,
  onPreviousPage,
  onSearchChange,
  page,
  search,
  totalPages,
}: TeacherEnrollStudentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? `Enrolar alumno en ${course.name}` : 'Enrolar alumno'}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <Input
          label="Buscar alumno"
          placeholder="Username o nombre"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && hasError && <Alert tone="error">{errorMessage}</Alert>}

        {!isLoading && !hasError && availableStudents && availableStudents.results.length === 0 && (
          <EmptyState
            icon="student"
            title="Sin alumnos disponibles"
            description="Todos los alumnos ya estan enrolados en este curso o no hay coincidencias."
            className="py-6"
          />
        )}

        {!isLoading && !hasError && availableStudents && availableStudents.results.length > 0 && (
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
                    isLoading={isSubmittingStudent(student.id)}
                    onClick={() => {
                      onEnroll(student.id)
                    }}
                  >
                    Inscribir
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              <p className="muted-text text-xs">
                Mostrando {availableStudents.results.length} de {availableStudents.count} alumno(s).
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={onPreviousPage}
                >
                  Anterior
                </Button>
                <span className="muted-text text-xs">
                  Pagina {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  disabled={page >= totalPages}
                  onClick={onNextPage}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
