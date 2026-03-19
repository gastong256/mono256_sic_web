import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { useToast } from '@/shared/ui/ToastProvider'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { useExecuteClosing } from '@/features/companies/hooks/useExecuteClosing'
import { usePreviewClosing } from '@/features/companies/hooks/usePreviewClosing'
import type {
  BalanceSheet,
  ClosingAdjustmentStatus,
  ClosingState,
  IncomeStatement,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'
import type { LogicalExercise } from '@/features/companies/types/logicalExercises.types'
import { getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: string | null): string {
  if (value === null) return '—'
  const parsed = Number(value)
  return arsFormatter.format(Number.isFinite(parsed) ? parsed : 0)
}

function addDays(date: string, amount: number): string {
  const base = new Date(`${date}T00:00:00`)
  if (Number.isNaN(base.getTime())) return ''
  base.setDate(base.getDate() + amount)
  return base.toISOString().slice(0, 10)
}

function getMinimumClosingDate(state?: ClosingState | null): string {
  const candidates = [
    state?.books_closed_until ? addDays(state.books_closed_until, 1) : '',
    state?.current_exercise?.start_date ?? '',
  ].filter(Boolean)

  return candidates.sort().at(-1) ?? new Date().toISOString().slice(0, 10)
}

function buildDefaultRequest(state?: ClosingState | null): SimplifiedClosingRequest {
  const minDate = getMinimumClosingDate(state)
  const today = new Date().toISOString().slice(0, 10)
  const baseDate = today > minDate ? today : minDate
  const reopeningDate = addDays(baseDate, 1)

  return {
    closing_date: baseDate,
    reopening_date: reopeningDate,
    cash_actual: '',
    inventory_actual: '',
  }
}

function validateClosingRequest(value: SimplifiedClosingRequest): string | null {
  if (!value.closing_date) return 'La fecha de cierre es obligatoria.'
  if (!value.reopening_date) return 'La fecha de reapertura es obligatoria.'
  if (value.reopening_date <= value.closing_date) {
    return 'La fecha de reapertura debe ser posterior a la fecha de cierre.'
  }

  const optionalAmounts = [
    { label: 'arqueo de caja', value: value.cash_actual },
    { label: 'inventario de mercaderías', value: value.inventory_actual },
  ]

  for (const item of optionalAmounts) {
    if (!item.value) continue
    const amount = Number(item.value)
    if (!Number.isFinite(amount) || amount < 0) {
      return `Ingresá un importe válido para ${item.label}.`
    }
  }

  return null
}

function getAdjustmentStatusLabel(status: ClosingAdjustmentStatus): string {
  switch (status) {
    case 'balanced':
      return 'Sin diferencia'
    case 'shortage':
      return 'Faltante'
    case 'surplus':
      return 'Sobrante'
    default:
      return 'No solicitado'
  }
}

function getPreviewEntries(preview: SimplifiedClosingPreview) {
  return [
    ...preview.entries.adjustments,
    ...preview.entries.result_closing,
    ...(preview.entries.patrimonial_closing ? [preview.entries.patrimonial_closing] : []),
    ...(preview.entries.reopening ? [preview.entries.reopening] : []),
  ]
}

function getExerciseLabel(exercise: LogicalExercise | null): string {
  if (!exercise) return 'Sin ejercicio lógico activo'
  return `Ejercicio ${exercise.exercise_index} · ${exercise.start_date}${
    exercise.closing_date ? ` a ${exercise.closing_date}` : ''
  }`
}

function renderStatementAccounts(accounts: IncomeStatement['positive_results']['accounts']) {
  if (accounts.length === 0) {
    return <p className="mt-2 text-sm text-[var(--text-muted)]">Sin cuentas detalladas.</p>
  }

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {accounts.map((account, index) => (
        <li key={`${account.account_code ?? account.account_name}-${index}`}>
          {account.account_code ? `${account.account_code} · ` : ''}
          {account.account_name}: {formatAmount(account.amount)}
        </li>
      ))}
    </ul>
  )
}

function renderBalanceGroups(groups: BalanceSheet['assets']['groups']) {
  if (groups.length === 0) {
    return <p className="mt-2 text-sm text-[var(--text-muted)]">Sin grupos detallados.</p>
  }

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {groups.map((group) => (
        <li key={`${group.account_code}-${group.account_name}`}>
          {group.account_code} · {group.account_name}: {formatAmount(group.amount)}
        </li>
      ))}
    </ul>
  )
}

interface ClosingWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: number
  state?: ClosingState | null
}

export function ClosingWorkflowModal({
  isOpen,
  onClose,
  companyId,
  state,
}: ClosingWorkflowModalProps) {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const previewMutation = usePreviewClosing(companyId)
  const executeMutation = useExecuteClosing(companyId)
  const [form, setForm] = useState<SimplifiedClosingRequest>(() => buildDefaultRequest(state))
  const [preview, setPreview] = useState<SimplifiedClosingPreview | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setForm(buildDefaultRequest(state))
    setPreview(null)
    setSubmitError(null)
  }, [isOpen, state])

  const isPending = previewMutation.isPending || executeMutation.isPending
  const minClosingDate = useMemo(() => getMinimumClosingDate(state) || undefined, [state])
  const minReopeningDate = useMemo(
    () => addDays(form.closing_date, 1) || undefined,
    [form.closing_date]
  )

  function handleClose() {
    setPreview(null)
    setSubmitError(null)
    onClose()
  }

  async function handlePreview() {
    const validationError = validateClosingRequest(form)
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setSubmitError(null)

    try {
      const response = await previewMutation.mutateAsync({
        ...form,
        ...(form.cash_actual ? { cash_actual: form.cash_actual } : {}),
        ...(form.inventory_actual ? { inventory_actual: form.inventory_actual } : {}),
      })
      setPreview(response)
    } catch (error) {
      setSubmitError(
        getHttpErrorMessage(error, {
          defaultMessage: 'No se pudo preparar la preview del cierre.',
          badRequestMessage: 'Revisá las fechas y los importes cargados.',
          unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
          forbiddenMessage: 'No tenés permisos para preparar el cierre de esta empresa.',
          notFoundMessage: 'La empresa ya no existe o no está disponible.',
        })
      )
    }
  }

  async function handleExecute() {
    const payload = {
      ...form,
      ...(form.cash_actual ? { cash_actual: form.cash_actual } : {}),
      ...(form.inventory_actual ? { inventory_actual: form.inventory_actual } : {}),
    }

    try {
      const response = await executeMutation.mutateAsync(payload)
      pushToast(
        response.created_entries.length > 0
          ? 'Cierre ejecutado correctamente y asientos generados.'
          : 'Cierre ejecutado correctamente.',
        'success'
      )
      handleClose()
      if (response.snapshot_id) {
        void navigate(`/companies/${companyId}/closing/snapshots/${response.snapshot_id}`)
      }
    } catch (error) {
      setSubmitError(
        getHttpErrorMessage(error, {
          defaultMessage: 'No se pudo ejecutar el cierre.',
          badRequestMessage: 'Revisá los datos del cierre e intentá nuevamente.',
          unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
          forbiddenMessage: 'No tenés permisos para ejecutar el cierre de esta empresa.',
          notFoundMessage: 'La empresa ya no existe o no está disponible.',
        })
      )
    }
  }

  const previewEntries = preview ? getPreviewEntries(preview) : []

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={preview ? 'Confirmar cierre contable' : 'Preparar cierre contable'}
      className="max-w-5xl"
    >
      <div className="space-y-5">
        {submitError && <Alert tone="error">{submitError}</Alert>}

        {!preview ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Fecha de cierre"
                type="date"
                value={form.closing_date}
                min={minClosingDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    closing_date: event.target.value,
                    reopening_date:
                      current.reopening_date && current.reopening_date > event.target.value
                        ? current.reopening_date
                        : addDays(event.target.value, 1),
                  }))
                }
              />
              <Input
                label="Fecha de reapertura"
                type="date"
                value={form.reopening_date}
                min={minReopeningDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reopening_date: event.target.value }))
                }
              />
              <Input
                label="Arqueo de caja real (opcional)"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="Ej. 1100.00"
                value={form.cash_actual ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cash_actual: event.target.value }))
                }
              />
              <Input
                label="Inventario real de mercaderías (opcional)"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="Ej. 450.00"
                value={form.inventory_actual ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, inventory_actual: event.target.value }))
                }
              />
            </div>

            <Alert tone="info">
              Primero se genera una preview del cierre. Recién después vas a poder confirmar la
              ejecución real.
            </Alert>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handlePreview()} isLoading={isPending}>
                Ver preview
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Fechas</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>Cierre: {preview.closing_date}</p>
                  <p>Reapertura: {preview.reopening_date}</p>
                  <p>Libros cerrados hoy: {preview.books_closed_until ?? 'Sin cierres previos'}</p>
                  <p>Ejercicio activo: {getExerciseLabel(preview.active_exercise)}</p>
                </div>
              </article>

              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Resultado</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>Resultado negativo: {formatAmount(preview.result_summary.negative_total)}</p>
                  <p>Resultado positivo: {formatAmount(preview.result_summary.positive_total)}</p>
                  <p>Resultado neto: {formatAmount(preview.result_summary.net_result)}</p>
                  <p>
                    Tipo:{' '}
                    {preview.result_summary.net_result_kind === 'gain'
                      ? 'Ganancia'
                      : preview.result_summary.net_result_kind === 'loss'
                        ? 'Pérdida'
                        : 'Neutro'}
                  </p>
                </div>
              </article>

              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Ajustes</p>
                <div className="mt-3 space-y-3 text-sm">
                  {[
                    { key: 'cash', label: 'Caja', value: preview.adjustments.cash },
                    {
                      key: 'inventory',
                      label: 'Mercaderías',
                      value: preview.adjustments.inventory,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3"
                    >
                      <p className="font-semibold text-[var(--text-strong)]">{item.label}</p>
                      <p className="muted-text mt-1 text-xs">
                        Estado: {getAdjustmentStatusLabel(item.value.status)}
                      </p>
                      <div className="mt-2 grid gap-1 text-xs text-[var(--text-muted)]">
                        <span>Contable: {formatAmount(item.value.book_balance)}</span>
                        <span>Real: {formatAmount(item.value.actual_balance)}</span>
                        <span>Diferencia: {formatAmount(item.value.difference)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {preview.previous_exercises.length > 0 && (
              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Ejercicios anteriores
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {preview.previous_exercises.map((exercise) => (
                    <div key={exercise.exercise_id} className="flex flex-wrap gap-2">
                      <span className="metric-chip">
                        Ejercicio {exercise.exercise_index} · {exercise.start_date}
                        {exercise.closing_date ? ` a ${exercise.closing_date}` : ''}
                      </span>
                      {exercise.snapshot_id !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            void navigate(
                              `/companies/${companyId}/closing/snapshots/${exercise.snapshot_id}`
                            )
                          }
                        >
                          Ver snapshot
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )}

            {preview.income_statement && (
              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Estado de resultados
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                    <p className="font-semibold text-[var(--text-strong)]">Resultados positivos</p>
                    <p className="mt-2 text-sm">
                      Total: {formatAmount(preview.income_statement.positive_results.total)}
                    </p>
                    {renderStatementAccounts(preview.income_statement.positive_results.accounts)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                    <p className="font-semibold text-[var(--text-strong)]">Resultados negativos</p>
                    <p className="mt-2 text-sm">
                      Total: {formatAmount(preview.income_statement.negative_results.total)}
                    </p>
                    {renderStatementAccounts(preview.income_statement.negative_results.accounts)}
                  </div>
                </div>
              </article>
            )}

            {preview.balance_sheet && (
              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Balance general ajustado
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                    <p className="font-semibold text-[var(--text-strong)]">Activo</p>
                    <p className="mt-2 text-sm">
                      Total: {formatAmount(preview.balance_sheet.assets.total)}
                    </p>
                    {renderBalanceGroups(preview.balance_sheet.assets.groups)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                    <p className="font-semibold text-[var(--text-strong)]">Pasivo</p>
                    <p className="mt-2 text-sm">
                      Total: {formatAmount(preview.balance_sheet.liabilities.total)}
                    </p>
                    {renderBalanceGroups(preview.balance_sheet.liabilities.groups)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                    <p className="font-semibold text-[var(--text-strong)]">Patrimonio neto</p>
                    <p className="mt-2 text-sm">
                      Total: {formatAmount(preview.balance_sheet.equity.total)}
                    </p>
                    <p className="mt-2 text-sm">
                      Resultado del ejercicio:{' '}
                      {formatAmount(preview.balance_sheet.equity.derived_result?.amount ?? null)}
                    </p>
                    {renderBalanceGroups(preview.balance_sheet.equity.groups)}
                  </div>
                </div>
              </article>
            )}

            <section className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Asientos a generar
                </p>
                <p className="muted-text mt-1 text-xs">
                  Revisá este plan antes de confirmar la ejecución real del cierre.
                </p>
              </div>

              {previewEntries.length === 0 ? (
                <Alert tone="warning">La preview no generó asientos para este cierre.</Alert>
              ) : (
                <ul className="space-y-3">
                  {previewEntries.map((entry, index) => (
                    <li
                      key={`${entry.source_ref}-${entry.date}-${index}`}
                      className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-strong)]">
                            {entry.description}
                          </p>
                          <p className="muted-text mt-1 text-xs">
                            {entry.date} · {getJournalSourceTypeLabel(entry.source_type)} · Ref.{' '}
                            {entry.source_ref || '—'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p>Debe: {formatAmount(entry.total_debit)}</p>
                          <p>Haber: {formatAmount(entry.total_credit)}</p>
                        </div>
                      </div>

                      {entry.lines.length > 0 && (
                        <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-white p-3">
                          <ul className="space-y-2 text-sm">
                            {entry.lines.map((line, lineIndex) => (
                              <li
                                key={`${line.parent_code ?? 'line'}-${lineIndex}`}
                                className="flex flex-wrap items-center justify-between gap-2"
                              >
                                <span className="text-[var(--text-strong)]">
                                  {line.account_name}
                                  {line.parent_code ? ` (${line.parent_code})` : ''}
                                </span>
                                <span className="muted-text text-xs">
                                  {line.type === 'DEBIT' ? 'Debe' : 'Haber'} ·{' '}
                                  {formatAmount(line.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPreview(null)
                  setSubmitError(null)
                }}
                disabled={isPending}
              >
                Volver a editar
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void handleExecute()} isLoading={isPending}>
                  Ejecutar cierre
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
