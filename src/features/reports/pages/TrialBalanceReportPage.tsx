import { Fragment, useMemo, useState } from 'react'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useTrialBalanceReport } from '@/features/reports/hooks/useTrialBalanceReport'
import { useDownloadTrialBalanceReport } from '@/features/reports/hooks/useDownloadReports'
import { getReportDownloadErrorMessage } from '@/features/reports/lib/downloadErrors'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { useToast } from '@/shared/ui/ToastProvider'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: number) {
  return arsFormatter.format(value)
}

export function TrialBalanceReportPage() {
  const { pushToast } = useToast()
  const { activeCompanyId } = useActiveCompanyStore()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isError, error } = useTrialBalanceReport(activeCompanyId, filters)
  const downloadMutation = useDownloadTrialBalanceReport()
  const canSearch = !hasInvalidRange && activeCompanyId !== null

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
            disabled={activeCompanyId === null || hasInvalidRange}
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
        <Alert tone="warning">Selecciona una empresa para ver el Balance de Comprobacion.</Alert>
      )}

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner
            className="size-8 text-[var(--brand-500)]"
            label="Cargando balance de comprobacion..."
          />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">
          {error instanceof Error ? error.message : 'No se pudo cargar el balance de comprobación.'}
        </Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">Totales generales</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Debe: {formatAmount(data.grand_total_debit)}</span>
              <span className="metric-chip">Haber: {formatAmount(data.grand_total_credit)}</span>
              <span className="metric-chip">
                Diferencia: {formatAmount(data.grand_total_debit - data.grand_total_credit)}
              </span>
            </div>
          </div>

          {data.rows.length === 0 ? (
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
                    {data.rows.map((row) => (
                      <Fragment key={`g-${row.level2_id}`}>
                        <tr className="data-table-head">
                          <td className="font-semibold text-[var(--text-strong)]">
                            {row.code} · {row.name}
                          </td>
                          <td className="amount-cell font-semibold">
                            {formatAmount(row.total_debit)}
                          </td>
                          <td className="amount-cell font-semibold">
                            {formatAmount(row.total_credit)}
                          </td>
                          <td className="amount-cell font-semibold">{formatAmount(row.balance)}</td>
                        </tr>
                        {row.accounts.map((account) => (
                          <tr key={`a-${account.account_id}`}>
                            <td className="pl-8">
                              {account.code} · {account.name}
                            </td>
                            <td className="amount-cell amount-cell-debit">
                              {formatAmount(account.total_debit)}
                            </td>
                            <td className="amount-cell amount-cell-credit">
                              {formatAmount(account.total_credit)}
                            </td>
                            <td className="amount-cell">{formatAmount(account.balance)}</td>
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
