import { useMemo } from 'react'
import {
  useSetTeacherCourseDemoVisibility,
  useTeacherCourseDemoCompanies,
} from '@/features/teacher/hooks/useTeacherCourseDemoVisibility'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { Spinner } from '@/shared/ui/Spinner'
import { getSemanticBadgeClassName } from '@/shared/ui/semanticTones'
import { useToast } from '@/shared/ui/ToastProvider'

interface TeacherCourseDemoVisibilityModalProps {
  course: { id: number; name: string } | null
  isOpen: boolean
  onClose: () => void
}

export function TeacherCourseDemoVisibilityModal({
  course,
  isOpen,
  onClose,
}: TeacherCourseDemoVisibilityModalProps) {
  const { pushToast } = useToast()
  const courseId = course?.id ?? 0
  const { data, isLoading, error } = useTeacherCourseDemoCompanies(courseId, { enabled: isOpen })
  const visibilityMutation = useSetTeacherCourseDemoVisibility()

  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar la visibilidad de demos para este curso.',
        forbiddenMessage: 'No tenés permisos para gestionar demos en este curso.',
        notFoundMessage: 'El curso ya no existe o no está disponible.',
      }),
    [error]
  )

  async function handleToggle(companyId: number, nextVisible: boolean) {
    if (!course) return
    try {
      await visibilityMutation.mutateAsync({
        courseId: course.id,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? `Demos del curso · ${course.name}` : 'Demos del curso'}
      className="max-w-5xl xl:max-w-6xl"
    >
      <div className="space-y-4">
        <Alert tone="info">
          Elegí qué empresas demo publicadas querés mostrar u ocultar para los alumnos enrolados en
          este curso.
        </Alert>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="size-7 text-[var(--brand-500)]" label="Cargando demos…" />
          </div>
        )}

        {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

        {!isLoading && !error && data && data.demo_companies.length === 0 && (
          <EmptyState
            icon="companies"
            title="No hay demos configurables"
            description="No encontramos empresas demo disponibles para este curso."
            className="border-none py-8"
          />
        )}

        {!isLoading && !error && data && data.demo_companies.length > 0 && (
          <div className="space-y-3">
            {data.demo_companies.map((company) => {
              const isPending =
                visibilityMutation.isPending &&
                visibilityMutation.variables?.courseId === courseId &&
                visibilityMutation.variables?.companyId === company.company_id

              return (
                <article
                  key={company.company_id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-4 lg:px-5"
                >
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)_auto] lg:items-start lg:gap-5">
                    <div className="min-w-0 space-y-2.5">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="text-base font-semibold text-[var(--text-strong)]">
                          {company.company_name}
                        </p>
                        <span
                          className={getSemanticBadgeClassName(
                            company.is_visible ? 'visible' : 'hidden'
                          )}
                        >
                          {company.is_visible ? 'Visible en este curso' : 'Oculta en este curso'}
                        </span>
                        <span className={getSemanticBadgeClassName('demo')}>Demo</span>
                        {company.is_read_only && (
                          <span className={getSemanticBadgeClassName('readonly')}>
                            Solo lectura
                          </span>
                        )}
                        <span
                          className={getSemanticBadgeClassName(
                            company.is_published ? 'published' : 'unpublished'
                          )}
                        >
                          {company.is_published ? 'Publicada globalmente' : 'No publicada'}
                        </span>
                      </div>

                      {company.demo_slug && (
                        <p className="muted-text text-sm">Slug de demo: {company.demo_slug}</p>
                      )}
                    </div>

                    <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border-soft)]/80 bg-white/70 px-4 py-3 lg:min-w-0">
                      <div className="space-y-1">
                        <dt className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
                          Cuentas
                        </dt>
                        <dd className="text-sm font-semibold text-[var(--text-strong)]">
                          {company.account_count}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[0.72rem] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
                          Asientos
                        </dt>
                        <dd className="text-sm font-semibold text-[var(--text-strong)]">
                          {company.journal_entry_count}
                        </dd>
                      </div>
                    </dl>

                    <Button
                      type="button"
                      variant={company.is_visible ? 'secondary' : 'primary'}
                      className="w-full lg:w-auto lg:min-w-[13.5rem]"
                      isLoading={isPending}
                      onClick={() => {
                        void handleToggle(company.company_id, !company.is_visible)
                      }}
                    >
                      {company.is_visible ? 'Ocultar en este curso' : 'Mostrar en este curso'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
