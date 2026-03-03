import { useMemo, useState } from 'react'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useLedgerReport } from '@/features/reports/hooks/useLedgerReport'
import { useJournalAccounts } from '@/features/journal/hooks/useJournalAccounts'
import { Spinner } from '@/shared/ui/Spinner'

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Libro Mayor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Movimientos por cuenta con saldo acumulado en el período.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-sm text-gray-600">
            Desde
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5"
            />
          </label>
          <label className="text-sm text-gray-600">
            Hasta
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5"
            />
          </label>
          <label className="text-sm text-gray-600">
            Cuenta (opcional)
            <select
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5"
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
            <button
              type="button"
              disabled={!canSearch}
              onClick={() =>
                setFilters({
                  dateFrom: dateFromInput || undefined,
                  dateTo: dateToInput || undefined,
                  accountId: accountIdInput ? Number(accountIdInput) : undefined,
                })
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFromInput('')
                setDateToInput('')
                setAccountIdInput('')
                setFilters({})
              }}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
        {hasInvalidRange && (
          <p className="mt-2 text-sm text-red-600">La fecha desde no puede ser mayor a hasta.</p>
        )}
      </section>

      {activeCompanyId === null && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Seleccioná una empresa para ver el Libro Mayor.
        </div>
      )}

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-blue-600" label="Cargando libro mayor…" />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudo cargar el Libro Mayor.'}
        </div>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {data.cards.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              No hay movimientos para los filtros seleccionados.
            </div>
          ) : (
            data.cards.map((card) => (
              <article
                key={card.account_id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">
                    {card.account_code} · {card.account_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Debe {formatAmount(card.total_debit)} | Haber {formatAmount(card.total_credit)}{' '}
                    | Saldo final {formatAmount(card.ending_balance)}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="px-3 py-2">Asiento</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Detalle</th>
                        <th className="px-3 py-2 text-right">Debe</th>
                        <th className="px-3 py-2 text-right">Haber</th>
                        <th className="px-3 py-2 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {card.movements.map((movement) => (
                        <tr
                          key={`${card.account_id}-${movement.entry_id}-${movement.entry_number}`}
                        >
                          <td className="px-3 py-2 text-gray-700">#{movement.entry_number}</td>
                          <td className="px-3 py-2 text-gray-700">{movement.date}</td>
                          <td className="px-3 py-2 text-gray-700">{movement.description}</td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {movement.debit > 0 ? formatAmount(movement.debit) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {movement.credit > 0 ? formatAmount(movement.credit) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
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
