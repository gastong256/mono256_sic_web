import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { ReportDateFilters } from '@/features/reports/components/ReportDateFilters'
import { useLedgerReport } from '@/features/reports/hooks/useLedgerReport'
import { useDownloadLedgerReport } from '@/features/reports/hooks/useDownloadReports'
import {
  ReportExerciseInfo,
  ReportExercisePanel,
} from '@/features/reports/components/ReportExercisePanel'
import { getReportCacheConfig } from '@/features/reports/lib/reportCache'
import { getReportDownloadErrorMessage } from '@/features/reports/lib/downloadErrors'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { formatARSAmount, hasNonZeroAmount } from '@/shared/lib/currency'
import { useToast } from '@/shared/ui/ToastProvider'
import { extractFieldValidationErrors, getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { getAccountTypeLabel, getNormalBalanceLabel } from '@/shared/lib/accountingLabels'

export function LedgerReportPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { activeCompanyId } = useActiveCompanyStore()
  const {
    activeCompany,
    canManageOpening,
    canWriteCompany,
    isAccountingReady,
    booksClosedUntil,
    accountingBlockMessage,
    isLoading: companyLoading,
  } = useActiveCompany()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [accountIdInput, setAccountIdInput] = useState('')
  const [filters, setFilters] = useState<{
    dateFrom?: string
    dateTo?: string
    accountId?: number
  }>({})
  const reportCacheConfig = useMemo(() => getReportCacheConfig(activeCompany), [activeCompany])

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )
  const { data, isLoading, isFetching, isError, error } = useLedgerReport(
    activeCompanyId,
    filters,
    {
      enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
      ...reportCacheConfig,
    }
  )
  const accountOptions = useMemo(() => data?.account_options ?? [], [data])
  const downloadMutation = useDownloadLedgerReport()
  const fieldErrors = useMemo(() => extractFieldValidationErrors(error), [error])
  const reportErrorMessage = useMemo(() => {
    const accountError = fieldErrors.account_id
    if (accountError) return accountError

    return getHttpErrorMessage(error, {
      defaultMessage: 'No se pudo cargar el Libro Mayor.',
      badRequestMessage: 'Revisá los filtros aplicados e intentá nuevamente.',
      unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      forbiddenMessage: 'No tenés permisos para consultar este reporte.',
      notFoundMessage: 'La empresa no existe o ya no está disponible.',
      conflictMessage: !isAccountingReady ? (accountingBlockMessage ?? undefined) : undefined,
    })
  }, [accountingBlockMessage, error, fieldErrors.account_id, isAccountingReady])

  const canSearch = !hasInvalidRange && activeCompanyId !== null

  async function handleDownload() {
    if (activeCompanyId === null) return
    try {
      const result = await downloadMutation.mutateAsync({
        companyId: activeCompanyId,
        params: filters,
      })
      const filename = result.filename ?? buildDefaultXlsxFilename('libro-mayor')
      saveBlobAsFile(result.blob, filename)
      pushToast('Descarga iniciada correctamente.', 'success')
    } catch (downloadError) {
      pushToast(getReportDownloadErrorMessage(downloadError), 'error')
    }
  }

  function applyExerciseRange(startDate: string, closingDate: string | null) {
    const nextFilters = {
      dateFrom: startDate,
      dateTo: closingDate ?? undefined,
      accountId: accountIdInput ? Number(accountIdInput) : undefined,
    }
    setDateFromInput(nextFilters.dateFrom)
    setDateToInput(nextFilters.dateTo ?? '')
    setFilters(nextFilters)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="ledger"
        title="Libro Mayor"
        subtitle="Movimientos por cuenta con saldo acumulado en el periodo."
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

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <ReportExercisePanel
          companyId={activeCompanyId}
          activeExercise={data.active_exercise}
          previousExercises={data.previous_exercises}
          onSelectExercise={(exercise) =>
            applyExerciseRange(exercise.start_date, exercise.closing_date)
          }
          onSelectSnapshot={(exercise) => {
            if (activeCompanyId === null || exercise.snapshot_id === null) return
            void navigate(`/reports/closing/snapshots/${exercise.snapshot_id}`)
          }}
        />
      )}

      <ReportDateFilters
        dateFrom={dateFromInput}
        dateTo={dateToInput}
        onDateFromChange={setDateFromInput}
        onDateToChange={setDateToInput}
        onApply={() =>
          setFilters({
            dateFrom: dateFromInput || undefined,
            dateTo: dateToInput || undefined,
            accountId: accountIdInput ? Number(accountIdInput) : undefined,
          })
        }
        onClear={() => {
          setDateFromInput('')
          setDateToInput('')
          setAccountIdInput('')
          setFilters({})
        }}
        canApply={canSearch}
        hasInvalidRange={hasInvalidRange}
        extraFields={
          <label className="field-label">
            Cuenta (opcional)
            <select
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              className="field-control"
            >
              <option value="">Todas</option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <ReportExerciseInfo
          requestedRange={data.requested_range}
          exerciseRange={data.exercise_range}
          visibleRange={data.visible_range}
          activeExercise={data.active_exercise}
        />
      )}

      {activeCompanyId === null && (
        <Alert tone="warning">Selecciona una empresa para ver el Libro Mayor.</Alert>
      )}

      {activeCompanyId !== null && (
        <CompanyPendingOpeningState
          company={activeCompany}
          icon="ledger"
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

      <CompanyBooksClosedAlert booksClosedUntil={booksClosedUntil} />

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro mayor..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">{reportErrorMessage}</Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {isFetching && (
            <Alert tone="info">Actualizando el Libro Mayor con los filtros aplicados…</Alert>
          )}

          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">
              {data.company || 'Empresa seleccionada'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Desde: {data.date_from ?? '—'}</span>
              <span className="metric-chip">Hasta: {data.date_to ?? '—'}</span>
              {data.active_exercise && (
                <span className="metric-chip">
                  Ejercicio: #{data.active_exercise.exercise_index}
                </span>
              )}
              <span className="metric-chip">
                Cuenta:{' '}
                {data.account_id === null ? 'Todas las cuentas de movimiento' : data.account_id}
              </span>
            </div>
          </div>

          {data.accounts.length === 0 ? (
            <EmptyState
              icon="ledger"
              title="Sin movimientos en el periodo"
              description="No hay movimientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            data.accounts.map((card, index) => (
              <article
                key={`${card.account_code}-${index}`}
                className="ui-fade-in ui-lift data-table-shell"
              >
                <div className="data-table-head border-b border-[var(--border-soft)] px-3 py-2">
                  <p className="font-semibold text-[var(--text-strong)]">
                    {card.account_code} · {card.account_name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Tipo {getAccountTypeLabel(card.account_type)} · Saldo normal{' '}
                    {getNormalBalanceLabel(card.normal_balance)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="metric-chip">
                      Saldo inicial {formatARSAmount(card.opening_balance)}
                    </span>
                    <span className="metric-chip">
                      Debe {formatARSAmount(card.period_totals.total_debit)}
                    </span>
                    <span className="metric-chip">
                      Haber {formatARSAmount(card.period_totals.total_credit)}
                    </span>
                    <span className="metric-chip">
                      Saldo final {formatARSAmount(card.closing_balance)}
                    </span>
                  </div>
                </div>
                <div className="accounting-table-scroll">
                  <table className="accounting-table">
                    <thead>
                      <tr>
                        <th scope="col">Asiento</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Detalle</th>
                        <th scope="col">Ref.</th>
                        <th scope="col" className="amount-col">
                          Debe
                        </th>
                        <th scope="col" className="amount-col">
                          Haber
                        </th>
                        <th scope="col" className="amount-col">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="data-table-head">
                        <td>—</td>
                        <td>{data.date_from ?? '—'}</td>
                        <td>Saldo inicial</td>
                        <td>—</td>
                        <td className="amount-cell-empty">—</td>
                        <td className="amount-cell-empty">—</td>
                        <td className="amount-cell">{formatARSAmount(card.opening_balance)}</td>
                      </tr>

                      {card.movements.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-4 text-center text-sm text-[var(--text-muted)]"
                          >
                            Sin movimientos en el periodo consultado.
                          </td>
                        </tr>
                      )}

                      {card.movements.map((movement, movementIndex) => (
                        <tr
                          key={`${card.account_code}-${movement.entry_number}-${movement.date}-${movementIndex}`}
                        >
                          <td>#{movement.entry_number}</td>
                          <td>{movement.date}</td>
                          <td>{movement.description}</td>
                          <td>{movement.source_ref || '—'}</td>
                          <td
                            className={
                              hasNonZeroAmount(movement.debit)
                                ? 'amount-cell amount-cell-debit'
                                : 'amount-cell-empty'
                            }
                          >
                            {hasNonZeroAmount(movement.debit)
                              ? formatARSAmount(movement.debit)
                              : '—'}
                          </td>
                          <td
                            className={
                              hasNonZeroAmount(movement.credit)
                                ? 'amount-cell amount-cell-credit'
                                : 'amount-cell-empty'
                            }
                          >
                            {hasNonZeroAmount(movement.credit)
                              ? formatARSAmount(movement.credit)
                              : '—'}
                          </td>
                          <td className="amount-cell">{formatARSAmount(movement.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  )
}
