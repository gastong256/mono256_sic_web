import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { ReportDateFilters } from '@/features/reports/components/ReportDateFilters'
import { useTrialBalanceReport } from '@/features/reports/hooks/useTrialBalanceReport'
import { useDownloadTrialBalanceReport } from '@/features/reports/hooks/useDownloadReports'
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
import { formatARSAmount } from '@/shared/lib/currency'
import { useToast } from '@/shared/ui/ToastProvider'
import { extractFieldValidationErrors, getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { getAccountTypeLabel } from '@/shared/lib/accountingLabels'

export function TrialBalanceReportPage() {
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
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})
  const reportCacheConfig = useMemo(() => getReportCacheConfig(activeCompany), [activeCompany])

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isFetching, isError, error } = useTrialBalanceReport(
    activeCompanyId,
    filters,
    {
      enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
      ...reportCacheConfig,
    }
  )
  const downloadMutation = useDownloadTrialBalanceReport()
  const canSearch = !hasInvalidRange && activeCompanyId !== null
  const fieldErrors = useMemo(() => extractFieldValidationErrors(error), [error])
  const reportErrorMessage = useMemo(() => {
    if (fieldErrors.date_from) return fieldErrors.date_from
    if (fieldErrors.date_to) return fieldErrors.date_to

    return getHttpErrorMessage(error, {
      defaultMessage: 'No se pudo cargar el Balance de Comprobación.',
      badRequestMessage: 'Revisá los filtros de fecha e intentá nuevamente.',
      unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      forbiddenMessage: 'No tenés permisos para consultar este reporte.',
      notFoundMessage: 'La empresa no existe o ya no está disponible.',
      conflictMessage: !isAccountingReady ? (accountingBlockMessage ?? undefined) : undefined,
    })
  }, [accountingBlockMessage, error, fieldErrors.date_from, fieldErrors.date_to, isAccountingReady])

  async function handleDownload() {
    if (activeCompanyId === null) return
    try {
      const result = await downloadMutation.mutateAsync({
        companyId: activeCompanyId,
        params: filters,
      })
      const filename = result.filename ?? buildDefaultXlsxFilename('balance-comprobacion')
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
    }
    setDateFromInput(nextFilters.dateFrom)
    setDateToInput(nextFilters.dateTo ?? '')
    setFilters(nextFilters)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="balance"
        title="Balance de Comprobacion"
        subtitle="Saldos por colectiva y subcuenta para verificar consistencia del periodo."
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
          })
        }
        onClear={() => {
          setDateFromInput('')
          setDateToInput('')
          setFilters({})
        }}
        canApply={canSearch}
        hasInvalidRange={hasInvalidRange}
        actionsClassName="md:col-span-2"
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
        <Alert tone="warning">Selecciona una empresa para ver el Balance de Comprobacion.</Alert>
      )}

      {activeCompanyId !== null && (
        <CompanyPendingOpeningState
          company={activeCompany}
          icon="balance"
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
          <Spinner
            className="size-8 text-[var(--brand-500)]"
            label="Cargando balance de comprobacion..."
          />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">{reportErrorMessage}</Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {isFetching && (
            <Alert tone="info">
              Actualizando el Balance de Comprobación con los filtros aplicados…
            </Alert>
          )}

          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">
              {data.company || 'Totales generales'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Desde: {data.date_from ?? '—'}</span>
              <span className="metric-chip">Hasta: {data.date_to ?? '—'}</span>
              {data.active_exercise && (
                <span className="metric-chip">
                  Ejercicio: #{data.active_exercise.exercise_index}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="summary-stat-card">
                <p className="summary-stat-label">Debe</p>
                <p className="summary-stat-value text-[#145f91]">
                  {formatARSAmount(data.grand_total_debit)}
                </p>
              </div>
              <div className="summary-stat-card">
                <p className="summary-stat-label">Haber</p>
                <p className="summary-stat-value text-[#8f4b12]">
                  {formatARSAmount(data.grand_total_credit)}
                </p>
              </div>
              <div className="summary-stat-card">
                <p className="summary-stat-label">Saldo deudor</p>
                <p className="summary-stat-value">
                  {formatARSAmount(data.totals.total_debit_balance)}
                </p>
              </div>
              <div className="summary-stat-card">
                <p className="summary-stat-label">Saldo acreedor</p>
                <p className="summary-stat-value">
                  {formatARSAmount(data.totals.total_credit_balance)}
                </p>
              </div>
            </div>
          </div>

          {data.groups.length === 0 ? (
            <EmptyState
              icon="balance"
              title="Sin movimientos en el periodo"
              description="No hay movimientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            <div className="ui-fade-in accounting-table-shell">
              <div className="accounting-table-scroll">
                <table className="accounting-table">
                  <thead>
                    <tr>
                      <th scope="col">Cuenta</th>
                      <th scope="col">Tipo</th>
                      <th scope="col" className="amount-col">
                        Debe
                      </th>
                      <th scope="col" className="amount-col">
                        Haber
                      </th>
                      <th scope="col" className="amount-col">
                        Saldo deudor
                      </th>
                      <th scope="col" className="amount-col">
                        Saldo acreedor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((group) => (
                      <Fragment key={`g-${group.account_code}`}>
                        <tr className="data-table-head">
                          <td className="font-semibold text-[var(--text-strong)]">
                            {group.account_code} · {group.account_name}
                          </td>
                          <td className="font-semibold text-[var(--text-muted)]">
                            {getAccountTypeLabel(group.account_type)}
                          </td>
                          <td className="amount-cell font-semibold">
                            {formatARSAmount(group.subtotal_debit)}
                          </td>
                          <td className="amount-cell font-semibold">
                            {formatARSAmount(group.subtotal_credit)}
                          </td>
                          <td className="amount-cell font-semibold">
                            {group.subtotal_debit_balance !== null
                              ? formatARSAmount(group.subtotal_debit_balance)
                              : '—'}
                          </td>
                          <td className="amount-cell font-semibold">
                            {group.subtotal_credit_balance !== null
                              ? formatARSAmount(group.subtotal_credit_balance)
                              : '—'}
                          </td>
                        </tr>
                        {group.accounts.map((account) => (
                          <tr key={`a-${account.account_code}`}>
                            <td className="pl-8">
                              {account.account_code} · {account.account_name}
                            </td>
                            <td>{getAccountTypeLabel(account.account_type)}</td>
                            <td className="amount-cell amount-cell-debit">
                              {formatARSAmount(account.total_debit)}
                            </td>
                            <td className="amount-cell amount-cell-credit">
                              {formatARSAmount(account.total_credit)}
                            </td>
                            <td className="amount-cell">
                              {account.debit_balance !== null
                                ? formatARSAmount(account.debit_balance)
                                : '—'}
                            </td>
                            <td className="amount-cell">
                              {account.credit_balance !== null
                                ? formatARSAmount(account.credit_balance)
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
