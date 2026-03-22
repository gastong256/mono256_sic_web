import { useMemo, type ReactNode } from 'react'
import {
  useSetTeacherCourseDemoVisibility,
  useSetTeacherCourseSharedVisibility,
  useTeacherCourseDemoCompanies,
  useTeacherCourseSharedCompanies,
} from '@/features/teacher/hooks/useTeacherCourseDemoVisibility'
import type {
  TeacherCourseDemoCompany,
  TeacherCourseSharedCompany,
} from '@/features/teacher/types/teacher.types'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { Spinner } from '@/shared/ui/Spinner'
import { getSemanticBadgeClassName } from '@/shared/ui/semanticTones'
import { useToast } from '@/shared/ui/ToastProvider'

interface TeacherCourseVisibilityModalProps {
  course: { id: number; name: string } | null
  isOpen: boolean
  onClose: () => void
}

function VisibilityMetrics({
  accountCount,
  journalEntryCount,
}: {
  accountCount: number
  journalEntryCount: number
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border-soft)]/80 bg-white/80 px-4 py-3 lg:min-w-0">
      <div className="space-y-1">
        <dt className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
          Cuentas
        </dt>
        <dd className="text-sm font-semibold text-[var(--text-strong)]">{accountCount}</dd>
      </div>
      <div className="space-y-1">
        <dt className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
          Asientos
        </dt>
        <dd className="text-sm font-semibold text-[var(--text-strong)]">{journalEntryCount}</dd>
      </div>
    </dl>
  )
}

function CourseVisibilitySection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  isLoading,
  errorMessage,
  children,
}: {
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  isLoading: boolean
  errorMessage: string | null
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-subtle)]/75 p-4 lg:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--text-strong)]">{title}</h3>
        <p className="muted-text text-sm">{description}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner className="size-7 text-[var(--brand-500)]" label={`Cargando ${title}…`} />
        </div>
      )}

      {!isLoading && errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {!isLoading && !errorMessage && children}

      {!isLoading && !errorMessage && !children && (
        <EmptyState
          icon="companies"
          title={emptyTitle}
          description={emptyDescription}
          className="border-none py-8"
        />
      )}
    </section>
  )
}

function DemoCompanyCard({
  company,
  courseId,
  isPending,
  onToggle,
}: {
  company: TeacherCourseDemoCompany
  courseId: number
  isPending: boolean
  onToggle: (courseId: number, companyId: number, nextVisible: boolean) => void
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-soft)] bg-white/90 px-4 py-4 lg:px-5">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.85fr)_auto] lg:items-start lg:gap-5">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-start gap-2">
            <p className="text-base font-semibold text-[var(--text-strong)]">
              {company.company_name}
            </p>
            <span className={getSemanticBadgeClassName(company.is_visible ? 'visible' : 'hidden')}>
              {company.is_visible ? 'Visible en este curso' : 'Oculta en este curso'}
            </span>
            <span className={getSemanticBadgeClassName('demo')}>Demo</span>
            <span className={getSemanticBadgeClassName('readonly')}>Solo lectura</span>
          </div>

          {company.demo_slug && (
            <p className="muted-text text-sm">Slug de demo: {company.demo_slug}</p>
          )}
        </div>

        <VisibilityMetrics
          accountCount={company.account_count}
          journalEntryCount={company.journal_entry_count}
        />

        <Button
          type="button"
          variant={company.is_visible ? 'secondary' : 'primary'}
          className="w-full lg:w-auto lg:min-w-[14rem]"
          isLoading={isPending}
          onClick={() => onToggle(courseId, company.company_id, !company.is_visible)}
        >
          {company.is_visible ? 'Ocultar en este curso' : 'Mostrar en este curso'}
        </Button>
      </div>
    </article>
  )
}

function SharedCompanyCard({
  company,
  courseId,
  isPending,
  onToggle,
}: {
  company: TeacherCourseSharedCompany
  courseId: number
  isPending: boolean
  onToggle: (courseId: number, companyId: number, nextVisible: boolean) => void
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-soft)] bg-white/90 px-4 py-4 lg:px-5">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.85fr)_auto] lg:items-start lg:gap-5">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-start gap-2">
            <p className="text-base font-semibold text-[var(--text-strong)]">
              {company.company_name}
            </p>
            <span className={getSemanticBadgeClassName(company.is_visible ? 'visible' : 'hidden')}>
              {company.is_visible ? 'Visible en este curso' : 'Oculta en este curso'}
            </span>
            <span className={getSemanticBadgeClassName('readonly')}>Solo lectura para alumnos</span>
          </div>
          <p className="muted-text text-sm">
            Propietario:{' '}
            <span className="font-medium text-[var(--text-strong)]">@{company.owner_username}</span>
          </p>
        </div>

        <VisibilityMetrics
          accountCount={company.account_count}
          journalEntryCount={company.journal_entry_count}
        />

        <Button
          type="button"
          variant={company.is_visible ? 'secondary' : 'primary'}
          className="w-full lg:w-auto lg:min-w-[14rem]"
          isLoading={isPending}
          onClick={() => onToggle(courseId, company.company_id, !company.is_visible)}
        >
          {company.is_visible ? 'Ocultar en este curso' : 'Compartir con este curso'}
        </Button>
      </div>
    </article>
  )
}

export function TeacherCourseVisibilityModal({
  course,
  isOpen,
  onClose,
}: TeacherCourseVisibilityModalProps) {
  const { pushToast } = useToast()
  const courseId = course?.id ?? 0
  const {
    data: demosData,
    isLoading: demosLoading,
    error: demosError,
  } = useTeacherCourseDemoCompanies(courseId, { enabled: isOpen })
  const {
    data: sharedData,
    isLoading: sharedLoading,
    error: sharedError,
  } = useTeacherCourseSharedCompanies(courseId, { enabled: isOpen })
  const demoVisibilityMutation = useSetTeacherCourseDemoVisibility()
  const sharedVisibilityMutation = useSetTeacherCourseSharedVisibility()

  const demosErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(demosError, {
        defaultMessage: 'No se pudo cargar la visibilidad de demos para este curso.',
        forbiddenMessage: 'No tenés permisos para gestionar demos en este curso.',
        notFoundMessage: 'El curso ya no existe o no está disponible.',
      }),
    [demosError]
  )
  const sharedErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(sharedError, {
        defaultMessage: 'No se pudo cargar la visibilidad de empresas compartidas para este curso.',
        forbiddenMessage: 'No tenés permisos para gestionar empresas compartidas en este curso.',
        notFoundMessage: 'El curso ya no existe o no está disponible.',
      }),
    [sharedError]
  )

  async function handleToggleDemo(courseIdValue: number, companyId: number, nextVisible: boolean) {
    try {
      await demoVisibilityMutation.mutateAsync({
        courseId: courseIdValue,
        companyId,
        payload: { is_visible: nextVisible },
      })
      pushToast(
        nextVisible ? 'Demo visible para este curso.' : 'Demo oculta para este curso.',
        'success'
      )
    } catch (mutationError) {
      pushToast(
        getHttpErrorMessage(mutationError, {
          defaultMessage: 'No se pudo actualizar la visibilidad de la demo.',
          badRequestMessage: 'La empresa seleccionada no admite configuración por curso.',
          forbiddenMessage: 'No tenés permisos para actualizar esta demo.',
          notFoundMessage: 'La demo o el curso ya no existen.',
        }),
        'error'
      )
    }
  }

  async function handleToggleShared(
    courseIdValue: number,
    companyId: number,
    nextVisible: boolean
  ) {
    try {
      await sharedVisibilityMutation.mutateAsync({
        courseId: courseIdValue,
        companyId,
        payload: { is_visible: nextVisible },
      })
      pushToast(
        nextVisible
          ? 'Empresa compartida visible para este curso.'
          : 'Empresa compartida oculta para este curso.',
        'success'
      )
    } catch (mutationError) {
      pushToast(
        getHttpErrorMessage(mutationError, {
          defaultMessage: 'No se pudo actualizar la empresa compartida.',
          badRequestMessage: 'La empresa seleccionada no admite visibilidad por curso.',
          forbiddenMessage: 'No tenés permisos para actualizar esta empresa.',
          notFoundMessage: 'La empresa o el curso ya no existen.',
        }),
        'error'
      )
    }
  }

  const demoCompanies = demosData?.demo_companies ?? []
  const sharedCompanies = sharedData?.shared_companies ?? []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? `Visibilidad del curso · ${course.name}` : 'Visibilidad del curso'}
      className="max-w-6xl xl:max-w-7xl"
    >
      <div className="space-y-5">
        <Alert tone="info">
          Desde esta vista podés decidir qué demos y qué empresas propias quedan visibles para los
          alumnos enrolados en este curso.
        </Alert>

        <CourseVisibilitySection
          title="Empresas demo"
          description="Ejemplos guiados publicados globalmente para trabajar en modo solo lectura."
          emptyTitle="No hay demos configurables"
          emptyDescription="No encontramos empresas demo disponibles para este curso."
          isLoading={demosLoading}
          errorMessage={!demosLoading && demosError ? demosErrorMessage : null}
        >
          {demoCompanies.length > 0 ? (
            <div className="space-y-3">
              {demoCompanies.map((company) => (
                <DemoCompanyCard
                  key={company.company_id}
                  company={company}
                  courseId={courseId}
                  isPending={
                    demoVisibilityMutation.isPending &&
                    demoVisibilityMutation.variables?.courseId === courseId &&
                    demoVisibilityMutation.variables?.companyId === company.company_id
                  }
                  onToggle={handleToggleDemo}
                />
              ))}
            </div>
          ) : null}
        </CourseVisibilitySection>

        <CourseVisibilitySection
          title="Empresas compartidas"
          description="Empresas propias visibles para el curso en modo solo lectura."
          emptyTitle="No hay empresas compartibles"
          emptyDescription="No encontramos empresas propias no demo disponibles para compartir en este curso."
          isLoading={sharedLoading}
          errorMessage={!sharedLoading && sharedError ? sharedErrorMessage : null}
        >
          {sharedCompanies.length > 0 ? (
            <div className="space-y-3">
              {sharedCompanies.map((company) => (
                <SharedCompanyCard
                  key={company.company_id}
                  company={company}
                  courseId={courseId}
                  isPending={
                    sharedVisibilityMutation.isPending &&
                    sharedVisibilityMutation.variables?.courseId === courseId &&
                    sharedVisibilityMutation.variables?.companyId === company.company_id
                  }
                  onToggle={handleToggleShared}
                />
              ))}
            </div>
          ) : null}
        </CourseVisibilitySection>
      </div>
    </Modal>
  )
}
