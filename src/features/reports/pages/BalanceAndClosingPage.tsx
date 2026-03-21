import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { CompanyIdentitySummary } from '@/features/companies/components/CompanyIdentitySummary'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { useCompanyClosingState } from '@/features/companies/hooks/useCompanyClosingState'
import { useDownloadClosingSnapshot } from '@/features/companies/hooks/useDownloadClosingSnapshots'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { useLogicalExercises } from '@/features/companies/hooks/useLogicalExercises'
import { getClosingDownloadErrorMessage } from '@/features/companies/lib/closingDownloadErrors'
import { ClosingWorkflowModal } from '@/features/companies/components/ClosingWorkflowModal'
import { getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { formatARSAmount } from '@/shared/lib/currency'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { useToast } from '@/shared/ui/ToastProvider'
import { DOWNLOAD_EXCEL_BUTTON_CLASSNAME } from '@/shared/ui/downloadButtonClassName'
import {
  getExerciseSemanticTone,
  getSemanticCardClassName,
  getSemanticChipClassName,
} from '@/shared/ui/semanticTones'

export function BalanceAndClosingPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
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
  const downloadSnapshotMutation = useDownloadClosingSnapshot()

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

  const snapshotExercises =
    logicalExercises?.exercises.filter((exercise) => exercise.snapshot_id) ?? []
  const snapshotQueries = useQueries({
    queries: snapshotExercises.map((exercise) => ({
      queryKey: companyQueryKeys.snapshot(activeCompanyId ?? 0, exercise.snapshot_id!),
      queryFn: () => companyClosingApi.snapshot(activeCompanyId ?? 0, exercise.snapshot_id!),
      enabled: !companyLoading && activeCompanyId !== null && exercise.snapshot_id !== null,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 60 * 60 * 1000,
    })),
  })
  const snapshotsById = new Map(
    snapshotExercises.map((exercise, index) => [
      exercise.snapshot_id!,
      snapshotQueries[index]?.data,
    ])
  )

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

  const canStartClosing =
    canManageClosing && isAccountingReady && !isReadOnly && (closingState?.can_close ?? true)

  async function handleDownloadSnapshot(snapshotId: number) {
    if (activeCompanyId === null) return
    try {
      const result = await downloadSnapshotMutation.mutateAsync({
        companyId: activeCompanyId,
        snapshotId,
      })
      saveBlobAsFile(
        result.blob,
        result.filename ??
          buildDefaultXlsxFilename(`cierre-confirmado-${activeCompanyId}-${snapshotId}`)
      )
      pushToast('Descarga iniciada correctamente.', 'success')
    } catch (error) {
      pushToast(getClosingDownloadErrorMessage(error), 'error')
    }
  }

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

      <CompanyIdentitySummary
        company={activeCompany}
        fallbackName="Empresa activa"
        fallbackDescription="Seguimiento del cierre patrimonial, reapertura y cierres confirmados del ejercicio."
      />

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
            <article
              className={[
                'summary-stat-card',
                getSemanticCardClassName(
                  (closingState?.books_closed_until ?? activeCompany?.books_closed_until)
                    ? 'closed'
                    : 'neutral'
                ),
              ].join(' ')}
            >
              <p className="summary-stat-label">Libros cerrados hasta</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.books_closed_until ??
                  activeCompany?.books_closed_until ??
                  'Sin cierre'}
              </p>
            </article>
            <article
              className={[
                'summary-stat-card',
                getSemanticCardClassName(
                  closingState?.last_patrimonial_closing_date ? 'closed' : 'neutral'
                ),
              ].join(' ')}
            >
              <p className="summary-stat-label">Último cierre patrimonial</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_patrimonial_closing_date ?? 'Sin registrar'}
              </p>
            </article>
            <article
              className={[
                'summary-stat-card',
                getSemanticCardClassName(closingState?.last_reopening_date ? 'open' : 'neutral'),
              ].join(' ')}
            >
              <p className="summary-stat-label">Última reapertura</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_reopening_date ?? 'Sin registrar'}
              </p>
            </article>
            <article
              className={[
                'summary-stat-card',
                getSemanticCardClassName(closingState?.can_close ? 'success' : 'warning'),
              ].join(' ')}
            >
              <p className="summary-stat-label">Elegibilidad</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.can_close ? 'Puede cerrar' : 'No disponible'}
              </p>
            </article>
            <article
              className={[
                'summary-stat-card',
                getSemanticCardClassName(
                  closingState?.current_exercise
                    ? getExerciseSemanticTone(closingState.current_exercise.status, true)
                    : 'neutral'
                ),
              ].join(' ')}
            >
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

      {isAccountingReady && logicalExercises && logicalExercises.exercises.length > 0 && (
        <section className="page-section flex flex-col gap-4">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Ejercicios</p>
            <p className="muted-text mt-1 text-sm">
              Secuencia de apertura, cierres patrimoniales y reaperturas resuelta por backend.
            </p>
          </div>

          <div className="space-y-3">
            {logicalExercises.exercises.map((exercise) => {
              const snapshot =
                exercise.snapshot_id !== null
                  ? (snapshotsById.get(exercise.snapshot_id) ?? null)
                  : null

              return (
                <article
                  key={exercise.exercise_id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-4 lg:px-5"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--text-strong)]">
                            Ejercicio {exercise.exercise_index}
                          </p>
                          <span
                            className={getSemanticChipClassName(
                              getExerciseSemanticTone(
                                exercise.status,
                                exercise.exercise_id === logicalExercises.current_exercise_id
                              )
                            )}
                          >
                            {exercise.exercise_id === logicalExercises.current_exercise_id
                              ? 'Actual'
                              : exercise.status === 'closed'
                                ? 'Cerrado'
                                : 'Abierto'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--text-muted)]">
                          <p>Inicio: {exercise.start_date}</p>
                          <p>Cierre: {exercise.closing_date ?? 'Pendiente'}</p>
                          <p>Origen: {getJournalSourceTypeLabel(exercise.opening_source_type)}</p>
                        </div>
                      </div>
                    </div>

                    {exercise.snapshot_id !== null ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <article
                            className={[
                              'summary-stat-card min-w-0',
                              getSemanticCardClassName('closed'),
                            ].join(' ')}
                          >
                            <p className="summary-stat-label">Fecha de cierre</p>
                            <p className="summary-stat-value text-[0.9rem] xl:text-[0.95rem]">
                              {snapshot?.closing_date ?? exercise.closing_date ?? '—'}
                            </p>
                          </article>
                          <article className="summary-stat-card min-w-0">
                            <p className="summary-stat-label">Activo</p>
                            <p className="summary-stat-value text-[0.9rem] break-words xl:text-[0.95rem]">
                              {formatARSAmount(snapshot?.balance_sheet?.assets.total ?? null)}
                            </p>
                          </article>
                          <article className="summary-stat-card min-w-0">
                            <p className="summary-stat-label">Pasivo</p>
                            <p className="summary-stat-value text-[0.9rem] break-words xl:text-[0.95rem]">
                              {formatARSAmount(snapshot?.balance_sheet?.liabilities.total ?? null)}
                            </p>
                          </article>
                          <article className="summary-stat-card min-w-0">
                            <p className="summary-stat-label">Patrimonio neto</p>
                            <p className="summary-stat-value text-[0.9rem] break-words xl:text-[0.95rem]">
                              {formatARSAmount(snapshot?.balance_sheet?.equity.total ?? null)}
                            </p>
                          </article>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              navigate(`/reports/closing/snapshots/${exercise.snapshot_id}`)
                            }
                          >
                            Ver cierre confirmado
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={DOWNLOAD_EXCEL_BUTTON_CLASSNAME}
                            isLoading={
                              downloadSnapshotMutation.isPending &&
                              downloadSnapshotMutation.variables?.snapshotId ===
                                exercise.snapshot_id
                            }
                            onClick={() => {
                              void handleDownloadSnapshot(exercise.snapshot_id!)
                            }}
                          >
                            Descargar Excel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert tone="info">
                        Este ejercicio sigue abierto y todavía no tiene cierre confirmado.
                      </Alert>
                    )}
                  </div>
                </article>
              )
            })}
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
