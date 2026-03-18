import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { getCompanyAccountingBlockMessage } from '@/features/companies/lib/companyAccounting'
import { useLedgerReport } from '@/features/reports/hooks/useLedgerReport'
import { useDownloadLedgerReport } from '@/features/reports/hooks/useDownloadReports'
import { getReportDownloadErrorMessage } from '@/features/reports/lib/downloadErrors'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { useToast } from '@/shared/ui/ToastProvider'
import { extractFieldValidationErrors, getHttpErrorMessage } from '@/shared/lib/httpErrors'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: string | number | null) {
  const amount = typeof value === 'number' ? value : Number(value)
  return arsFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function hasAmount(value: number | null) {
  return value !== null && Math.abs(value) > 0
}

export function LedgerReportPage() {
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
  const isAccountingReady = activeCompany?.accounting_ready !== false

  const { data, isLoading, isError, error } = useLedgerReport(activeCompanyId, filters, {
    enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
  })
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
      conflictMessage:
        activeCompany?.accounting_ready === false || activeCompany?.is_read_only
          ? getCompanyAccountingBlockMessage(activeCompany)
          : undefined,
    })
  }, [activeCompany, error, fieldErrors.account_id])

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
              {accountOptions.map((account) => (
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

      {activeCompanyId !== null && activeCompany?.accounting_ready === false && (
        <EmptyState
          icon="ledger"
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
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro mayor..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">{reportErrorMessage}</Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">
              {data.company || 'Empresa seleccionada'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Desde: {data.date_from ?? '—'}</span>
              <span className="metric-chip">Hasta: {data.date_to ?? '—'}</span>
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
                    Tipo {card.account_type || '—'} · Saldo normal{' '}
                    {card.normal_balance === 'CREDIT' ? 'acreedor' : 'deudor'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="metric-chip">
                      Saldo inicial {formatAmount(card.opening_balance)}
                    </span>
                    <span className="metric-chip">
                      Debe {formatAmount(card.period_totals.total_debit)}
                    </span>
                    <span className="metric-chip">
                      Haber {formatAmount(card.period_totals.total_credit)}
                    </span>
                    <span className="metric-chip">
                      Saldo final {formatAmount(card.closing_balance)}
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
                        <td className="amount-cell">{formatAmount(card.opening_balance)}</td>
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
                              hasAmount(movement.debit)
                                ? 'amount-cell amount-cell-debit'
                                : 'amount-cell-empty'
                            }
                          >
                            {hasAmount(movement.debit) ? formatAmount(movement.debit) : '—'}
                          </td>
                          <td
                            className={
                              hasAmount(movement.credit)
                                ? 'amount-cell amount-cell-credit'
                                : 'amount-cell-empty'
                            }
                          >
                            {hasAmount(movement.credit) ? formatAmount(movement.credit) : '—'}
                          </td>
                          <td className="amount-cell">{formatAmount(movement.balance)}</td>
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
