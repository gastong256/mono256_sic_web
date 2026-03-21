import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { useCompanyClosingState } from '@/features/companies/hooks/useCompanyClosingState'
import { useLogicalExercises } from '@/features/companies/hooks/useLogicalExercises'
import { useLatestClosingSnapshot } from '@/features/companies/hooks/useClosingSnapshot'
import { ClosingWorkflowModal } from '@/features/companies/components/ClosingWorkflowModal'
import { getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'
import { formatARSAmount } from '@/shared/lib/currency'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

export function BalanceAndClosingPage() {
  const navigate = useNavigate()
  const {
    activeCompanyId,
    activeCompany,
    canManageClosing,
    canManageOpening,
    canWriteCompany,
    isAccountingReady,
    isReadOnly,
    booksClosedUntil,
    isLoading: companyLoading,
  } = useActiveCompany()
  const [closingModalOpen, setClosingModalOpen] = useState(false)

  const {
    data: closingState,
    isLoading: closingStateLoading,
    error: closingStateError,
  } = useCompanyClosingState(activeCompanyId ?? 0, {
    enabled: !companyLoading && activeCompanyId !== null,
  })
  const { data: logicalExercises } = useLogicalExercises(activeCompanyId ?? 0, {
    enabled: !companyLoading && activeCompanyId !== null,
  })

  const shouldLoadLatestSnapshot = Boolean(
    logicalExercises?.exercises.some((exercise) => exercise.snapshot_id !== null)
  )
  const {
    data: latestSnapshot,
    isLoading: latestSnapshotLoading,
    error: latestSnapshotError,
  } = useLatestClosingSnapshot(activeCompanyId ?? 0, {
    enabled: !companyLoading && activeCompanyId !== null && shouldLoadLatestSnapshot,
  })

  const closingStateErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(closingStateError, {
        defaultMessage: 'No se pudo cargar el estado de cierre de la empresa.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para consultar el estado de cierre.',
        notFoundMessage: 'La empresa ya no existe o no está disponible.',
      }),
    [closingStateError]
  )

  const latestSnapshotErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(latestSnapshotError, {
        defaultMessage: 'No se pudo cargar el último cierre confirmado.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para consultar el cierre confirmado.',
        notFoundMessage: 'Todavía no hay cierres confirmados para esta empresa.',
      }),
    [latestSnapshotError]
  )

  const canStartClosing =
    canManageClosing && isAccountingReady && !isReadOnly && (closingState?.can_close ?? true)

  if (activeCompanyId === null) {
    return (
      <EmptyState
        icon="balance"
        title="Seleccioná una empresa"
        description="Necesitás una empresa activa para consultar balance general y cierres."
        className="py-24"
      />
    )
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="balance"
        title="Balance General y Cierres"
        subtitle="Consultá el estado del ejercicio, los cierres confirmados y prepará cierres contables de la empresa activa."
        actions={
          <>
            {canStartClosing && (
              <Button type="button" onClick={() => setClosingModalOpen(true)}>
                Preparar cierre
              </Button>
            )}
          </>
        }
      />

      <section className="page-section-muted">
        <p className="text-sm font-semibold text-[var(--text-strong)]">
          {activeCompany?.name ?? 'Empresa activa'}
        </p>
        <p className="muted-text mt-1 text-sm">
          {activeCompany?.description ||
            'Seguimiento del cierre patrimonial, reapertura y cierres confirmados del ejercicio.'}
        </p>
      </section>

      <CompanyPendingOpeningState
        company={activeCompany}
        icon="balance"
        action={
          canManageOpening && canWriteCompany ? (
            <Button onClick={() => navigate(`/companies/${activeCompanyId}`)}>
              Ir a plan de cuentas
            </Button>
          ) : undefined
        }
        className="py-16"
      />

      {isAccountingReady && <CompanyBooksClosedAlert booksClosedUntil={booksClosedUntil} />}

      {isAccountingReady && closingStateLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando estado de cierre…" />
        </div>
      )}

      {isAccountingReady && closingStateError && !closingStateLoading && (
        <Alert tone="error">{closingStateErrorMessage}</Alert>
      )}

      {isAccountingReady && !closingStateLoading && !closingStateError && (
        <section className="page-section flex flex-col gap-4">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Estado de cierre</p>
            <p className="muted-text mt-1 text-sm">
              Seguimiento del último cierre patrimonial, la reapertura y el ejercicio activo.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="summary-stat-card">
              <p className="summary-stat-label">Libros cerrados hasta</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.books_closed_until ??
                  activeCompany?.books_closed_until ??
                  'Sin cierre'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Último cierre patrimonial</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_patrimonial_closing_date ?? 'Sin registrar'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Última reapertura</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_reopening_date ?? 'Sin registrar'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Elegibilidad</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.can_close ? 'Puede cerrar' : 'No disponible'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Ejercicio actual</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.current_exercise
                  ? `#${closingState.current_exercise.exercise_index} · ${closingState.current_exercise.start_date}`
                  : 'Sin ejercicio'}
              </p>
            </article>
          </div>

          {!canManageClosing && !isReadOnly && (
            <p className="muted-text text-sm">
              Solo el propietario o un administrador pueden ejecutar el cierre contable.
            </p>
          )}
        </section>
      )}

      {isAccountingReady && (
        <section className="page-section flex flex-col gap-4">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Balance general confirmado</p>
            <p className="muted-text mt-1 text-sm">
              Resumen del último cierre confirmado disponible para la empresa activa.
            </p>
          </div>

          {latestSnapshotLoading && shouldLoadLatestSnapshot && (
            <Spinner
              className="size-5 text-[var(--brand-500)]"
              label="Cargando cierre confirmado…"
            />
          )}

          {latestSnapshotError && !latestSnapshotLoading && (
            <Alert tone="info">{latestSnapshotErrorMessage}</Alert>
          )}

          {!shouldLoadLatestSnapshot && (
            <Alert tone="info">Todavía no hay cierres confirmados para esta empresa.</Alert>
          )}

          {latestSnapshot && !latestSnapshotLoading && !latestSnapshotError && (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <article className="summary-stat-card">
                  <p className="summary-stat-label">Fecha de cierre</p>
                  <p className="summary-stat-value text-[0.95rem]">{latestSnapshot.closing_date}</p>
                </article>
                <article className="summary-stat-card">
                  <p className="summary-stat-label">Activo</p>
                  <p className="summary-stat-value text-[0.95rem]">
                    {formatARSAmount(latestSnapshot.balance_sheet?.assets.total)}
                  </p>
                </article>
                <article className="summary-stat-card">
                  <p className="summary-stat-label">Pasivo</p>
                  <p className="summary-stat-value text-[0.95rem]">
                    {formatARSAmount(latestSnapshot.balance_sheet?.liabilities.total)}
                  </p>
                </article>
                <article className="summary-stat-card">
                  <p className="summary-stat-label">Patrimonio neto</p>
                  <p className="summary-stat-value text-[0.95rem]">
                    {formatARSAmount(latestSnapshot.balance_sheet?.equity.total)}
                  </p>
                </article>
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/reports/closing/latest-snapshot')}
                >
                  Ver cierre confirmado
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {isAccountingReady && logicalExercises && logicalExercises.exercises.length > 0 && (
        <section className="page-section flex flex-col gap-4">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Ejercicios lógicos</p>
            <p className="muted-text mt-1 text-sm">
              Secuencia de apertura, cierres patrimoniales y reaperturas resuelta por backend.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {logicalExercises.exercises.map((exercise) => (
              <article
                key={exercise.exercise_id}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text-strong)]">
                    Ejercicio {exercise.exercise_index}
                  </p>
                  <span className="metric-chip">
                    {exercise.exercise_id === logicalExercises.current_exercise_id
                      ? 'Actual'
                      : exercise.status === 'closed'
                        ? 'Cerrado'
                        : 'Abierto'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
                  <p>Inicio: {exercise.start_date}</p>
                  <p>Cierre: {exercise.closing_date ?? 'Pendiente'}</p>
                  <p>Origen: {getJournalSourceTypeLabel(exercise.opening_source_type)}</p>
                </div>
                {exercise.snapshot_id !== null && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(`/reports/closing/snapshots/${exercise.snapshot_id}`)}
                    >
                      Ver cierre confirmado
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {activeCompanyId !== null && (
        <ClosingWorkflowModal
          isOpen={closingModalOpen}
          onClose={() => setClosingModalOpen(false)}
          companyId={activeCompanyId}
          state={closingState}
        />
      )}
    </div>
  )
}
