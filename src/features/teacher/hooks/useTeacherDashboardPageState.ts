import { useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  useEnrollStudent,
  useTeacherAvailableStudents,
  useUnenrollStudent,
} from '@/features/teacher/hooks/useTeacherEnrollments'
import { useCreateCourse, useTeacherCoursesList } from '@/features/teacher/hooks/useTeacherCourses'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { useToast } from '@/shared/ui/ToastProvider'

const AVAILABLE_STUDENTS_PAGE_SIZE = 25

type EnrollCourse = {
  id: number
  name: string
}

function resetFormState(setters: Array<(value: string) => void>) {
  setters.forEach((setValue) => setValue(''))
}

export function useTeacherDashboardPageState() {
  const { user } = useAuthStore()
  const { pushToast } = useToast()
  const { data: courses = [], isLoading, error } = useTeacherCoursesList()
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [createCourseError, setCreateCourseError] = useState<string | null>(null)
  const [courseForEnroll, setCourseForEnroll] = useState<EnrollCourse | null>(null)
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

  const canCreateCourse = user?.role === 'teacher' || user?.role === 'admin'
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

  function openEnrollModal(course: EnrollCourse) {
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
      closeCreateCourseModal()
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

  function openCreateCourseModal() {
    setIsCreateCourseOpen(true)
  }

  function closeCreateCourseModal() {
    setIsCreateCourseOpen(false)
    setCreateCourseError(null)
    resetFormState([setNewCourseName, setNewCourseCode])
  }

  return {
    availableLoading,
    availableStudents,
    availableStudentsErrorMessage,
    hasAvailableStudentsError: Boolean(availableError),
    canCreateCourse,
    courseForEnroll,
    courses,
    createCourseError,
    createCourseMutation,
    dashboardErrorMessage,
    error,
    handleCreateCourse,
    handleEnroll,
    handleUnenroll,
    isCreateCourseOpen,
    isLoading,
    isUnenrolling: (courseId: number, studentId: number) =>
      unenrollMutation.isPending &&
      unenrollMutation.variables?.courseId === courseId &&
      unenrollMutation.variables?.studentId === studentId,
    newCourseCode,
    newCourseName,
    openCreateCourseModal,
    openEnrollModal,
    page,
    search,
    setNewCourseCode,
    setNewCourseName,
    setPage,
    setSearch,
    closeCreateCourseModal,
    closeEnrollModal,
    totalAvailablePages,
    isEnrollingStudent: (studentId: number) =>
      enrollMutation.isPending && enrollMutation.variables?.studentId === studentId,
  }
}
