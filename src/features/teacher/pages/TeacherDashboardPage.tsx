import { TeacherCoursePanel } from '@/features/teacher/components/TeacherCoursePanel'
import { TeacherCreateCourseModal } from '@/features/teacher/components/TeacherCreateCourseModal'
import { TeacherEnrollStudentModal } from '@/features/teacher/components/TeacherEnrollStudentModal'
import { useTeacherDashboardPageState } from '@/features/teacher/hooks/useTeacherDashboardPageState'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'

export function TeacherDashboardPage() {
  const {
    availableLoading,
    availableStudents,
    availableStudentsErrorMessage,
    canCreateCourse,
    closeCreateCourseModal,
    closeEnrollModal,
    courseForEnroll,
    courses,
    createCourseError,
    createCourseMutation,
    dashboardErrorMessage,
    error,
    hasAvailableStudentsError,
    handleCreateCourse,
    handleEnroll,
    handleUnenroll,
    isCreateCourseOpen,
    isEnrollingStudent,
    isLoading,
    isUnenrolling,
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
    totalAvailablePages,
  } = useTeacherDashboardPageState()

  return (
    <div className="space-y-6">
      <PageHeader
        icon="teacher"
        title="Panel docente"
        subtitle="Resumen de cursos y alumnos asignados."
        actions={
          canCreateCourse && (
            <Button type="button" onClick={openCreateCourseModal}>
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
              isUnenrolling={isUnenrolling}
            />
          ))}
        </div>
      )}

      <TeacherCreateCourseModal
        errorMessage={createCourseError}
        isOpen={isCreateCourseOpen}
        isSubmitting={createCourseMutation.isPending}
        name={newCourseName}
        code={newCourseCode}
        onClose={closeCreateCourseModal}
        onCodeChange={setNewCourseCode}
        onNameChange={setNewCourseName}
        onSubmit={() => {
          void handleCreateCourse()
        }}
      />

      <TeacherEnrollStudentModal
        availableStudents={availableStudents}
        course={courseForEnroll}
        errorMessage={availableStudentsErrorMessage}
        hasError={hasAvailableStudentsError}
        isLoading={availableLoading}
        isOpen={courseForEnroll !== null}
        isSubmittingStudent={isEnrollingStudent}
        onClose={closeEnrollModal}
        onEnroll={(studentId) => {
          void handleEnroll(studentId)
        }}
        onNextPage={() => setPage((value) => Math.min(totalAvailablePages, value + 1))}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={page}
        search={search}
        totalPages={totalAvailablePages}
      />
    </div>
  )
}
