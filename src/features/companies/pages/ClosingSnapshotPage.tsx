import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Spinner } from '@/shared/ui/Spinner'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import {
  useClosingSnapshot,
  useLatestClosingSnapshot,
} from '@/features/companies/hooks/useClosingSnapshot'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: string | null | undefined) {
  const amount = Number(value)
  return arsFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function ClosingSnapshotPage() {
  const navigate = useNavigate()
  const { companyId, snapshotId } = useParams<{ companyId: string; snapshotId?: string }>()
  const numericCompanyId = Number(companyId)
  const numericSnapshotId = Number(snapshotId)
  const shouldLoadSpecific = Number.isFinite(numericSnapshotId) && numericSnapshotId > 0

  const latestQuery = useLatestClosingSnapshot(numericCompanyId, {
    enabled: numericCompanyId > 0 && !shouldLoadSpecific,
  })
  const snapshotQuery = useClosingSnapshot(numericCompanyId, numericSnapshotId, {
    enabled: numericCompanyId > 0 && shouldLoadSpecific,
  })

  const data = shouldLoadSpecific ? snapshotQuery.data : latestQuery.data
  const isLoading = shouldLoadSpecific ? snapshotQuery.isLoading : latestQuery.isLoading
  const error = shouldLoadSpecific ? snapshotQuery.error : latestQuery.error
  const errorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar el snapshot confirmado del cierre.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para ver este snapshot.',
        notFoundMessage: 'El snapshot solicitado no existe o ya no está disponible.',
      }),
    [error]
  )

  return (
    <div className="page-shell">
      <PageHeader
        icon="balance"
        title="Snapshot confirmado del cierre"
        subtitle="Documento contable de solo lectura generado al confirmar el cierre."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/companies/${companyId}`)}
          >
            Volver a la empresa
          </Button>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando snapshot..." />
        </div>
      )}

      {error && !isLoading && <Alert tone="error">{errorMessage}</Alert>}

      {data && !isLoading && !error && (
        <div className="space-y-4">
          <Alert tone="info">
            Este snapshot es un documento confirmado del cierre. Su contenido es solo lectura.
          </Alert>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="summary-stat-card">
              <p className="summary-stat-label">Empresa</p>
              <p className="summary-stat-value text-[0.95rem]">{data.company}</p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Fecha de cierre</p>
              <p className="summary-stat-value text-[0.95rem]">{data.closing_date}</p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Fecha de reapertura</p>
              <p className="summary-stat-value text-[0.95rem]">{data.reopening_date}</p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Snapshot ID</p>
              <p className="summary-stat-value text-[0.95rem]">#{data.id}</p>
            </article>
          </div>

          {data.income_statement && (
            <section className="page-section">
              <p className="font-semibold text-[var(--text-strong)]">Estado de resultados</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Resultados positivos</p>
                  <p className="mt-2">
                    {formatAmount(data.income_statement.positive_results.total)}
                  </p>
                </article>
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Resultados negativos</p>
                  <p className="mt-2">
                    {formatAmount(data.income_statement.negative_results.total)}
                  </p>
                </article>
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Resultado neto</p>
                  <p className="mt-2">{formatAmount(data.income_statement.net_result.amount)}</p>
                </article>
              </div>
            </section>
          )}

          {data.balance_sheet && (
            <section className="page-section">
              <p className="font-semibold text-[var(--text-strong)]">Balance general confirmado</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Activo</p>
                  <p className="mt-2">{formatAmount(data.balance_sheet.assets.total)}</p>
                </article>
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Pasivo</p>
                  <p className="mt-2">{formatAmount(data.balance_sheet.liabilities.total)}</p>
                </article>
                <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-sm">
                  <p className="font-semibold text-[var(--text-strong)]">Patrimonio neto</p>
                  <p className="mt-2">{formatAmount(data.balance_sheet.equity.total)}</p>
                </article>
              </div>
              <div className="mt-3 text-sm text-[var(--text-muted)]">
                Resultado del ejercicio:{' '}
                <strong>{formatAmount(data.balance_sheet.equity.derived_result?.amount)}</strong>
              </div>
            </section>
          )}

          <section className="page-section">
            <p className="font-semibold text-[var(--text-strong)]">Líneas patrimoniales</p>
            {data.lines.length === 0 ? (
              <p className="muted-text mt-3 text-sm">No hay líneas patrimoniales registradas.</p>
            ) : (
              <div className="accounting-table-scroll mt-3">
                <table className="accounting-table">
                  <thead>
                    <tr>
                      <th scope="col">Cuenta</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Padre</th>
                      <th scope="col" className="amount-col">
                        Saldo deudor
                      </th>
                      <th scope="col" className="amount-col">
                        Saldo acreedor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line) => (
                      <tr key={`${line.account_code}-${line.account_name}`}>
                        <td>
                          {line.account_code} · {line.account_name}
                        </td>
                        <td>{line.account_type || '—'}</td>
                        <td>{line.parent_code ?? '—'}</td>
                        <td className="amount-cell">{formatAmount(line.debit_balance)}</td>
                        <td className="amount-cell">{formatAmount(line.credit_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
