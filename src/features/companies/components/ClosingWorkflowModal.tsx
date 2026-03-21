import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import {
  getAdjustmentStatusSemanticTone,
  getNetResultSemanticTone,
  getSemanticChipClassName,
} from '@/shared/ui/semanticTones'
import { useToast } from '@/shared/ui/ToastProvider'
import { formatARSAmount } from '@/shared/lib/currency'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { useCurrentBookBalances } from '@/features/companies/hooks/useCurrentBookBalances'
import { useExecuteClosing } from '@/features/companies/hooks/useExecuteClosing'
import { usePreviewClosing } from '@/features/companies/hooks/usePreviewClosing'
import type {
  BalanceSheet,
  ClosingAdjustmentStatus,
  CurrentBookBalances,
  ClosingStatementAccountDetail,
  ClosingState,
  IncomeStatement,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'
import type { LogicalExercise } from '@/features/companies/types/logicalExercises.types'
import { getJournalSourceTone, getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'

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

function getOrderedDraftLines(
  entry: SimplifiedClosingPreview['entries']['result_closing'][number]
) {
  return [...entry.lines].sort((left, right) => {
    if (left.type === right.type) return 0
    return left.type === 'DEBIT' ? -1 : 1
  })
}

function getExerciseLabel(exercise: LogicalExercise | null): string {
  if (!exercise) return 'Sin ejercicio lógico activo'
  return `Ejercicio ${exercise.exercise_index} · ${exercise.start_date}${
    exercise.closing_date ? ` a ${exercise.closing_date}` : ''
  }`
}

function formatPreviewAmount(value: string | null | undefined): string {
  return value === null || value === undefined ? '—' : formatARSAmount(value)
}

function getNetResultKindLabel(
  kind: SimplifiedClosingPreview['result_summary']['net_result_kind']
): string {
  return kind === 'gain' ? 'Ganancia' : kind === 'loss' ? 'Pérdida' : 'Neutro'
}

function PreviewMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3 gap-y-1">
      <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
        {label}
      </span>
      <span className="min-w-0 text-sm font-medium text-[var(--text-strong)]">{value}</span>
    </div>
  )
}

function CurrentBalanceHint({
  label,
  value,
  balances,
  isLoading,
}: {
  label: string
  value: CurrentBookBalances['cash'] | null
  balances: CurrentBookBalances | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return <p className="mt-1 text-xs text-[var(--text-muted)]">Cargando saldo contable…</p>
  }
  if (!value || !balances) return null

  return (
    <p className="mt-1 text-xs text-[var(--text-muted)]">
      {label} al {balances.as_of_date}:{' '}
      <span className="font-semibold text-[var(--text-strong)]">
        {formatARSAmount(value.book_balance)}
      </span>
    </p>
  )
}

function CurrentBalanceField({
  label,
  placeholder,
  value,
  onChange,
  balance,
  balances,
  isLoading,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  balance: CurrentBookBalances['cash'] | null
  balances: CurrentBookBalances | undefined
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[var(--text-strong)]">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'rounded-xl border px-3 py-2 text-sm transition-all duration-200',
          'bg-white/96 shadow-[inset_0_1px_0_rgb(255_255_255_/_85%)] placeholder:text-[var(--text-muted)]',
          'border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none',
        ].join(' ')}
      />
      <CurrentBalanceHint
        label="Saldo contable"
        value={balance}
        balances={balances}
        isLoading={isLoading}
      />
    </div>
  )
}

function renderNestedAccounts(accounts: ClosingStatementAccountDetail[]) {
  if (accounts.length === 0) return null

  return (
    <ul className="mt-2 space-y-1.5 border-l border-[var(--border-soft)] pl-3 text-xs text-[var(--text-muted)]">
      {accounts.map((account, index) => (
        <li
          key={`${account.account_code ?? account.account_name}-${index}`}
          className="flex items-start justify-between gap-3"
        >
          <span className="min-w-0">
            {account.account_code ? `${account.account_code} · ` : ''}
            {account.account_name}
          </span>
          <span className="font-medium whitespace-nowrap text-[var(--text-strong)]">
            {formatARSAmount(account.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function renderStatementAccounts(accounts: IncomeStatement['positive_results']['accounts']) {
  if (accounts.length === 0) {
    return <p className="mt-2 text-sm text-[var(--text-muted)]">Sin cuentas detalladas.</p>
  }

  return (
    <ul className="mt-2 space-y-2.5 text-sm">
      {accounts.map((account, index) => (
        <li
          key={`${account.account_code ?? account.account_name}-${index}`}
          className="rounded-xl border border-[var(--border-soft)] bg-white/70 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 font-medium text-[var(--text-strong)]">
              {account.account_code ? `${account.account_code} · ` : ''}
              {account.account_name}
            </span>
            <span className="font-semibold whitespace-nowrap text-[var(--text-strong)]">
              {formatARSAmount(account.subtotal)}
            </span>
          </div>
          {renderNestedAccounts(account.accounts)}
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
    <ul className="mt-2 space-y-2.5 text-sm">
      {groups.map((group) => (
        <li
          key={`${group.account_code}-${group.account_name}`}
          className="rounded-xl border border-[var(--border-soft)] bg-white/70 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 font-medium text-[var(--text-strong)]">
              {group.account_code} · {group.account_name}
            </span>
            <span className="font-semibold whitespace-nowrap text-[var(--text-strong)]">
              {formatARSAmount(group.subtotal)}
            </span>
          </div>
          {renderNestedAccounts(group.accounts)}
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
  const {
    data: currentBalances,
    isLoading: currentBalancesLoading,
    error: currentBalancesError,
  } = useCurrentBookBalances(companyId, form.closing_date || undefined, {
    enabled: isOpen && companyId > 0,
  })

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
        void navigate(`/reports/closing/snapshots/${response.snapshot_id}`)
      }
    } catch (error) {
      setSubmitError(
        getHttpErrorMessage(error, {
          defaultMessage: 'No se pudo ejecutar el cierre.',
          unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
          forbiddenMessage: 'No tenés permisos para ejecutar el cierre de esta empresa.',
          notFoundMessage: 'La empresa ya no existe o no está disponible.',
        })
      )
    }
  }

  const previewEntries = preview ? getPreviewEntries(preview) : []
  const currentBalancesErrorMessage = getHttpErrorMessage(currentBalancesError, {
    defaultMessage: 'No se pudieron cargar los saldos contables actuales.',
    unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
    forbiddenMessage: 'No tenés permisos para consultar estos saldos.',
    notFoundMessage: 'La empresa ya no existe o no está disponible.',
    conflictMessage: 'Los saldos contables solo están disponibles para empresas con apertura.',
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={preview ? 'Confirmar cierre contable' : 'Preparar cierre contable'}
      className="xl:max-w-6xl 2xl:max-w-7xl"
    >
      <div className="space-y-5">
        {state?.current_exercise?.start_date && (
          <p className="text-sm text-[var(--text-muted)]">
            Se va a cerrar el ejercicio abierto el{' '}
            <span className="font-semibold text-[var(--text-strong)]">
              {state.current_exercise.start_date}
            </span>
            .
          </p>
        )}

        {submitError && <Alert tone="error">{submitError}</Alert>}

        {!preview ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              <CurrentBalanceField
                label="Arqueo de caja real (opcional)"
                placeholder="Ej. 1100.00"
                value={form.cash_actual ?? ''}
                onChange={(value) => setForm((current) => ({ ...current, cash_actual: value }))}
                balance={currentBalances?.cash ?? null}
                balances={currentBalances}
                isLoading={currentBalancesLoading}
              />
              <CurrentBalanceField
                label="Inventario real de mercaderías (opcional)"
                placeholder="Ej. 450.00"
                value={form.inventory_actual ?? ''}
                onChange={(value) =>
                  setForm((current) => ({ ...current, inventory_actual: value }))
                }
                balance={currentBalances?.inventory ?? null}
                balances={currentBalances}
                isLoading={currentBalancesLoading}
              />
            </div>

            {currentBalancesError && <Alert tone="warning">{currentBalancesErrorMessage}</Alert>}

            <Alert tone="info">
              El cierre se prepara siempre sobre el ejercicio lógico abierto actual. Primero se
              genera una preview y recién después vas a poder confirmar la ejecución real.
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
            <div className="grid gap-4 xl:grid-cols-2">
              <article className="surface-card p-4 lg:p-5">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Fechas</p>
                <div className="mt-3 space-y-2.5">
                  <PreviewMetaRow label="Cierre" value={preview.closing_date} />
                  <PreviewMetaRow label="Reapertura" value={preview.reopening_date} />
                  <PreviewMetaRow
                    label="Libros"
                    value={preview.books_closed_until ?? 'Sin cierres previos'}
                  />
                  <PreviewMetaRow
                    label="Ejercicio"
                    value={getExerciseLabel(preview.active_exercise)}
                  />
                </div>
              </article>

              <article className="surface-card p-4 lg:p-5">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Resultado</p>
                <div className="mt-3 space-y-2.5">
                  <PreviewMetaRow
                    label="Negativo"
                    value={formatARSAmount(preview.result_summary.negative_total)}
                  />
                  <PreviewMetaRow
                    label="Positivo"
                    value={formatARSAmount(preview.result_summary.positive_total)}
                  />
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-3 py-2">
                    <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
                      Resultado neto
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="text-base font-semibold text-[var(--text-strong)]">
                        {formatARSAmount(preview.result_summary.net_result)}
                      </p>
                      <span
                        className={getSemanticChipClassName(
                          getNetResultSemanticTone(preview.result_summary.net_result_kind)
                        )}
                      >
                        {getNetResultKindLabel(preview.result_summary.net_result_kind)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="surface-card p-4 lg:p-5 xl:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-strong)]">Ajustes</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-[var(--text-strong)]">{item.label}</p>
                        <span
                          className={getSemanticChipClassName(
                            getAdjustmentStatusSemanticTone(item.value.status)
                          )}
                        >
                          {getAdjustmentStatusLabel(item.value.status)}
                        </span>
                      </div>
                      {item.value.status !== 'not_requested' && (
                        <div className="mt-2 space-y-1.5">
                          <PreviewMetaRow
                            label="Contable"
                            value={formatPreviewAmount(item.value.book_balance)}
                          />
                          <PreviewMetaRow
                            label="Real"
                            value={formatPreviewAmount(item.value.actual_balance)}
                          />
                          <PreviewMetaRow
                            label="Diferencia"
                            value={formatPreviewAmount(item.value.difference)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {preview.income_statement && (
              <article className="surface-card p-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Estado de resultados
                </p>
                <div className="mt-3 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 lg:p-4">
                    <p className="font-semibold text-[var(--text-strong)]">Resultados positivos</p>
                    <p className="mt-2 text-sm">
                      Total: {formatARSAmount(preview.income_statement.positive_results.total)}
                    </p>
                    {renderStatementAccounts(preview.income_statement.positive_results.accounts)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 lg:p-4">
                    <p className="font-semibold text-[var(--text-strong)]">Resultados negativos</p>
                    <p className="mt-2 text-sm">
                      Total: {formatARSAmount(preview.income_statement.negative_results.total)}
                    </p>
                    {renderStatementAccounts(preview.income_statement.negative_results.accounts)}
                  </div>
                </div>
              </article>
            )}

            {preview.balance_sheet && (
              <article className="surface-card border-sky-200/80 bg-gradient-to-b from-sky-50/70 to-white p-5 lg:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-sky-200/80 bg-white/80 px-4 py-3">
                  <p className="text-lg font-semibold text-[var(--text-strong)]">
                    Balance general ajustado
                  </p>
                  <span
                    className={getSemanticChipClassName(
                      preview.balance_sheet.equation.is_balanced ? 'success' : 'warning'
                    )}
                  >
                    {preview.balance_sheet.equation.is_balanced ? 'Balanceado' : 'Revisar ecuación'}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 lg:p-4">
                    <p className="font-semibold text-[var(--text-strong)]">Activo</p>
                    <p className="mt-2 text-sm">
                      Total: {formatARSAmount(preview.balance_sheet.assets.total)}
                    </p>
                    {renderBalanceGroups(preview.balance_sheet.assets.groups)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 lg:p-4">
                    <p className="font-semibold text-[var(--text-strong)]">Pasivo</p>
                    <p className="mt-2 text-sm">
                      Total: {formatARSAmount(preview.balance_sheet.liabilities.total)}
                    </p>
                    {renderBalanceGroups(preview.balance_sheet.liabilities.groups)}
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 lg:p-4">
                    <p className="font-semibold text-[var(--text-strong)]">Patrimonio neto</p>
                    <p className="mt-2 text-sm">
                      Total: {formatARSAmount(preview.balance_sheet.equity.total)}
                    </p>
                    <div className="mt-2 rounded-xl border border-sky-100 bg-white/85 px-3 py-2">
                      <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-sky-700 uppercase">
                        Resultado del ejercicio
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text-strong)]">
                        {formatARSAmount(
                          preview.balance_sheet.equity.derived_result?.amount ?? null
                        )}
                      </p>
                    </div>
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
                  {previewEntries.map((entry, index) =>
                    (() => {
                      const sourceTone = getJournalSourceTone(entry.source_type)
                      const orderedLines = getOrderedDraftLines(entry)

                      return (
                        <li
                          key={`${entry.source_ref}-${entry.date}-${index}`}
                          className="surface-card overflow-hidden"
                          style={sourceTone?.shellStyle}
                        >
                          <div
                            className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-soft)] px-5 py-4"
                            style={sourceTone?.headStyle}
                          >
                            <div>
                              <p
                                className="font-semibold"
                                style={
                                  sourceTone
                                    ? { color: sourceTone.titleColor }
                                    : { color: 'var(--text-strong)' }
                                }
                              >
                                {entry.description}
                              </p>
                              <p
                                className="mt-1 text-xs"
                                style={
                                  sourceTone
                                    ? { color: sourceTone.metaColor }
                                    : { color: 'var(--text-muted)' }
                                }
                              >
                                {entry.date} · {getJournalSourceTypeLabel(entry.source_type)} · Ref.{' '}
                                {entry.source_ref || '—'}
                              </p>
                            </div>
                            <div
                              className="text-right text-sm font-semibold"
                              style={sourceTone ? { color: sourceTone.totalsColor } : undefined}
                            >
                              <p>Debe: {formatARSAmount(entry.total_debit)}</p>
                              <p>Haber: {formatARSAmount(entry.total_credit)}</p>
                            </div>
                          </div>

                          {orderedLines.length > 0 && (
                            <div className="accounting-table-shell" style={sourceTone?.scrollStyle}>
                              <div className="accounting-table-scroll">
                                <table className="accounting-table">
                                  <thead style={sourceTone?.tableHeadStyle}>
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
                                    {orderedLines.map((line, lineIndex) => (
                                      <tr
                                        key={`${line.parent_code ?? line.account_name}-${lineIndex}`}
                                      >
                                        <td
                                          style={
                                            sourceTone
                                              ? {
                                                  backgroundColor:
                                                    lineIndex % 2 === 0
                                                      ? sourceTone.rowBgOdd
                                                      : sourceTone.rowBgEven,
                                                  color: sourceTone.rowTextColor,
                                                }
                                              : undefined
                                          }
                                        >
                                          {line.account_code ? `${line.account_code} · ` : ''}
                                          {line.account_name}
                                          {line.parent_code ? ` (${line.parent_code})` : ''}
                                        </td>
                                        <td
                                          className={
                                            line.type === 'DEBIT'
                                              ? 'amount-cell amount-cell-debit'
                                              : 'amount-cell-empty'
                                          }
                                          style={
                                            sourceTone
                                              ? {
                                                  backgroundColor:
                                                    lineIndex % 2 === 0
                                                      ? sourceTone.rowAmountBgOdd
                                                      : sourceTone.rowAmountBgEven,
                                                }
                                              : undefined
                                          }
                                        >
                                          {line.type === 'DEBIT'
                                            ? formatARSAmount(line.amount)
                                            : '—'}
                                        </td>
                                        <td
                                          className={
                                            line.type === 'CREDIT'
                                              ? 'amount-cell amount-cell-credit'
                                              : 'amount-cell-empty'
                                          }
                                          style={
                                            sourceTone
                                              ? {
                                                  backgroundColor:
                                                    lineIndex % 2 === 0
                                                      ? sourceTone.rowAmountBgOdd
                                                      : sourceTone.rowAmountBgEven,
                                                }
                                              : undefined
                                          }
                                        >
                                          {line.type === 'CREDIT'
                                            ? formatARSAmount(line.amount)
                                            : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })()
                  )}
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
