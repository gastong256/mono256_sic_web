import { useMemo, useState } from 'react'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useLedgerReport } from '@/features/reports/hooks/useLedgerReport'
import { useJournalAccounts } from '@/features/journal/hooks/useJournalAccounts'
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

export function LedgerReportPage() {
  const { activeCompanyId } = useActiveCompanyStore()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [accountIdInput, setAccountIdInput] = useState('')
  const [filters, setFilters] = useState<{
    dateFrom?: string
    dateTo?: string
    accountId?: number
  }>({})

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data: accounts = [] } = useJournalAccounts(activeCompanyId ?? 0)
  const { data, isLoading, isError, error } = useLedgerReport(activeCompanyId, filters)

  const canSearch = !hasInvalidRange && activeCompanyId !== null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro Mayor"
        subtitle="Movimientos por cuenta con saldo acumulado en el periodo."
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
          <label className="text-sm font-semibold text-[var(--text-muted)]">
            Cuenta (opcional)
            <select
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-2 py-1.5 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            >
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              disabled={!canSearch}
              onClick={() =>
                setFilters({
                  dateFrom: dateFromInput || undefined,
                  dateTo: dateToInput || undefined,
                  accountId: accountIdInput ? Number(accountIdInput) : undefined,
                })
              }
            >
              Aplicar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDateFromInput('')
                setDateToInput('')
                setAccountIdInput('')
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
        <Alert tone="warning">Selecciona una empresa para ver el Libro Mayor.</Alert>
      )}

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro mayor..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">
          {error instanceof Error ? error.message : 'No se pudo cargar el Libro Mayor.'}
        </Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {data.cards.length === 0 ? (
            <EmptyState
              title="Sin movimientos en el periodo"
              description="No hay movimientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            data.cards.map((card) => (
              <article key={card.account_id} className="ui-fade-in ui-lift data-table-shell">
                <div className="data-table-head border-b border-[var(--border-soft)] px-3 py-2">
                  <p className="font-semibold text-[var(--text-strong)]">
                    {card.account_code} · {card.account_name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="metric-chip">Debe {formatAmount(card.total_debit)}</span>
                    <span className="metric-chip">Haber {formatAmount(card.total_credit)}</span>
                    <span className="metric-chip">
                      Saldo final {formatAmount(card.ending_balance)}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="data-table-head">
                      <tr className="text-left">
                        <th scope="col" className="px-3 py-2">
                          Asiento
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Fecha
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Detalle
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
                      {card.movements.map((movement) => (
                        <tr
                          key={`${card.account_id}-${movement.entry_id}-${movement.entry_number}`}
                        >
                          <td className="px-3 py-2 text-[var(--text-strong)]">
                            #{movement.entry_number}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-strong)]">{movement.date}</td>
                          <td className="px-3 py-2 text-[var(--text-strong)]">
                            {movement.description}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                            {movement.debit > 0 ? formatAmount(movement.debit) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                            {movement.credit > 0 ? formatAmount(movement.credit) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-[var(--text-strong)]">
                            {formatAmount(movement.balance)}
                          </td>
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
