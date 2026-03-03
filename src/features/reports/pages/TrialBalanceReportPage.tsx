import { Fragment, useMemo, useState } from 'react'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useTrialBalanceReport } from '@/features/reports/hooks/useTrialBalanceReport'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: number) {
  return arsFormatter.format(value)
}

export function TrialBalanceReportPage() {
  const { activeCompanyId } = useActiveCompanyStore()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isError, error } = useTrialBalanceReport(activeCompanyId, filters)
  const canSearch = !hasInvalidRange && activeCompanyId !== null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance de Comprobacion"
        subtitle="Saldos por colectiva y subcuenta para verificar consistencia del periodo."
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
              title="Sin movimientos en el periodo"
              description="No hay movimientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            <div className="ui-fade-in data-table-shell">
              <table className="w-full text-sm">
                <thead className="data-table-head">
                  <tr className="text-left">
                    <th scope="col" className="px-3 py-2">
                      Cuenta
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Debe
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Haber
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {data.rows.map((row) => (
                    <Fragment key={`g-${row.level2_id}`}>
                      <tr className="data-table-head">
                        <td className="px-3 py-2 font-semibold text-[var(--text-strong)]">
                          {row.code} · {row.name}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[var(--text-strong)]">
                          {formatAmount(row.total_debit)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[var(--text-strong)]">
                          {formatAmount(row.total_credit)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[var(--text-strong)]">
                          {formatAmount(row.balance)}
                        </td>
                      </tr>
                      {row.accounts.map((account) => (
                        <tr key={`a-${account.account_id}`}>
                          <td className="px-3 py-2 pl-8 text-[var(--text-strong)]">
                            {account.code} · {account.name}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                            {formatAmount(account.total_debit)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                            {formatAmount(account.total_credit)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                            {formatAmount(account.balance)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
