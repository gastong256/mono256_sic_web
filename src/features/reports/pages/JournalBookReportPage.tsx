import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { getCompanyAccountingBlockMessage } from '@/features/companies/lib/companyAccounting'
import { useJournalBookReport } from '@/features/reports/hooks/useJournalBookReport'
import { useDownloadJournalBookReport } from '@/features/reports/hooks/useDownloadReports'
import { ReportExercisePanel } from '@/features/reports/components/ReportExercisePanel'
import { getReportCacheConfig } from '@/features/reports/lib/reportCache'
import { getReportDownloadErrorMessage } from '@/features/reports/lib/downloadErrors'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { useToast } from '@/shared/ui/ToastProvider'
import { extractFieldValidationErrors, getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value)
  return arsFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function JournalBookReportPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { activeCompanyId } = useActiveCompanyStore()
  const {
    activeCompany,
    canManageOpening,
    canWriteCompany,
    isLoading: companyLoading,
  } = useActiveCompany()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})
  const isAccountingReady = activeCompany?.accounting_ready !== false
  const reportCacheConfig = useMemo(() => getReportCacheConfig(activeCompany), [activeCompany])

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isFetching, isError, error } = useJournalBookReport(
    activeCompanyId,
    filters,
    {
      enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
      ...reportCacheConfig,
    }
  )
  const downloadMutation = useDownloadJournalBookReport()
  const fieldErrors = useMemo(() => extractFieldValidationErrors(error), [error])
  const reportErrorMessage = useMemo(() => {
    if (fieldErrors.date_from) return fieldErrors.date_from
    if (fieldErrors.date_to) return fieldErrors.date_to

    return getHttpErrorMessage(error, {
      defaultMessage: 'No se pudo cargar el Libro Diario.',
      badRequestMessage: 'Revisá los filtros de fecha e intentá nuevamente.',
      unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      forbiddenMessage: 'No tenés permisos para consultar este reporte.',
      notFoundMessage: 'La empresa no existe o ya no está disponible.',
      conflictMessage:
        activeCompany?.accounting_ready === false || activeCompany?.is_read_only
          ? getCompanyAccountingBlockMessage(activeCompany)
          : undefined,
    })
  }, [activeCompany, error, fieldErrors.date_from, fieldErrors.date_to])

  const canSearch = !hasInvalidRange && activeCompanyId !== null

  async function handleDownload() {
    if (activeCompanyId === null) return
    try {
      const result = await downloadMutation.mutateAsync({
        companyId: activeCompanyId,
        params: filters,
      })
      const filename = result.filename ?? buildDefaultXlsxFilename('libro-diario')
      saveBlobAsFile(result.blob, filename)
      pushToast('Descarga iniciada correctamente.', 'success')
    } catch (downloadError) {
      pushToast(getReportDownloadErrorMessage(downloadError), 'error')
    }
  }

  function applyExerciseRange(startDate: string, closingDate: string | null) {
    const nextFilters = {
      dateFrom: startDate,
      dateTo: closingDate ?? data?.date_to ?? undefined,
    }
    setDateFromInput(nextFilters.dateFrom)
    setDateToInput(nextFilters.dateTo ?? '')
    setFilters(nextFilters)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="book"
        title="Libro Diario"
        subtitle="Consulta asientos cronologicos y sus lineas de doble entrada."
        actions={
          <Button
            type="button"
            variant="secondary"
            className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            disabled={activeCompanyId === null || hasInvalidRange || !isAccountingReady}
            isLoading={downloadMutation.isPending}
            onClick={() => {
              void handleDownload()
            }}
          >
            Descargar Excel
          </Button>
        }
      />

      <section className="filter-panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold text-[var(--text-muted)]">
            Desde
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-2 py-1.5 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--text-muted)]">
            Hasta
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-2 py-1.5 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            />
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              type="button"
              disabled={!canSearch}
              onClick={() =>
                setFilters({
                  dateFrom: dateFromInput || undefined,
                  dateTo: dateToInput || undefined,
                })
              }
            >
              Aplicar filtros
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDateFromInput('')
                setDateToInput('')
                setFilters({})
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
        {hasInvalidRange && (
          <p className="mt-2 text-sm text-red-600">La fecha desde no puede ser mayor a hasta.</p>
        )}
      </section>

      {activeCompanyId === null && (
        <Alert tone="warning">Selecciona una empresa para ver el Libro Diario.</Alert>
      )}

      {activeCompanyId !== null && activeCompany?.accounting_ready === false && (
        <EmptyState
          icon="book"
          title="Pendiente de apertura contable"
          description={getCompanyAccountingBlockMessage(activeCompany)}
          action={
            canManageOpening && canWriteCompany ? (
              <Button onClick={() => navigate(`/companies/${activeCompanyId}`)}>
                Registrar apertura
              </Button>
            ) : undefined
          }
          className="py-12"
        />
      )}

      {activeCompanyId !== null && activeCompany?.books_closed_until && (
        <Alert tone="info">
          Los libros están cerrados hasta <strong>{activeCompany.books_closed_until}</strong>.
        </Alert>
      )}

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro diario..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">{reportErrorMessage}</Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {isFetching && (
            <Alert tone="info">Actualizando el Libro Diario con los filtros aplicados…</Alert>
          )}

          <ReportExercisePanel
            requestedRange={data.requested_range}
            exerciseRange={data.exercise_range}
            visibleRange={data.visible_range}
            activeExercise={data.active_exercise}
            previousExercises={data.previous_exercises}
            onSelectExercise={(exercise) =>
              applyExerciseRange(exercise.start_date, exercise.closing_date)
            }
            onSelectSnapshot={(exercise) => {
              if (activeCompanyId === null || exercise.snapshot_id === null) return
              void navigate(
                `/companies/${activeCompanyId}/closing/snapshots/${exercise.snapshot_id}`
              )
            }}
          />

          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">
              {data.company || 'Resumen del periodo'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Desde: {data.date_from ?? '—'}</span>
              <span className="metric-chip">Hasta: {data.date_to ?? '—'}</span>
              {data.active_exercise && (
                <span className="metric-chip">
                  Ejercicio: #{data.active_exercise.exercise_index}
                </span>
              )}
              <span className="metric-chip">Asientos: {data.entries.length}</span>
              <span className="metric-chip">Debe: {formatAmount(data.grand_total_debit)}</span>
              <span className="metric-chip">Haber: {formatAmount(data.grand_total_credit)}</span>
            </div>
          </div>

          {data.entries.length === 0 ? (
            <EmptyState
              icon="book"
              title="Sin resultados en el periodo"
              description="No hay asientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            <ul className="space-y-3">
              {data.entries.map((entry, index) => (
                <li
                  key={`${entry.entry_number}-${entry.date}-${index}`}
                  className="ui-fade-in ui-lift data-table-shell"
                >
                  <div className="data-table-head flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] px-3 py-2 text-sm">
                    <div>
                      <span className="font-semibold text-[var(--text-strong)]">
                        Asiento #{entry.entry_number} · {entry.date} · {entry.description}
                      </span>
                      <p className="muted-text mt-1 text-xs">
                        Origen {getJournalSourceTypeLabel(entry.source_type)} · Ref.{' '}
                        {entry.source_ref || '—'}
                      </p>
                    </div>
                    <span className="font-medium text-[var(--text-muted)]">
                      Debe {formatAmount(entry.total_debit)} | Haber{' '}
                      {formatAmount(entry.total_credit)}
                    </span>
                  </div>
                  <div className="accounting-table-scroll">
                    <table className="accounting-table">
                      <thead>
                        <tr>
                          <th scope="col">Cuenta</th>
                          <th scope="col" className="amount-col">
                            Debe
                          </th>
                          <th scope="col" className="amount-col">
                            Haber
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line, index) => (
                          <tr key={`${entry.entry_number}-${index}`}>
                            <td>
                              {line.account_code} · {line.account_name}
                            </td>
                            <td
                              className={
                                line.debit !== null
                                  ? 'amount-cell amount-cell-debit'
                                  : 'amount-cell-empty'
                              }
                            >
                              {line.debit !== null ? formatAmount(line.debit) : '—'}
                            </td>
                            <td
                              className={
                                line.credit !== null
                                  ? 'amount-cell amount-cell-credit'
                                  : 'amount-cell-empty'
                              }
                            >
                              {line.credit !== null ? formatAmount(line.credit) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
