import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCompanyAccounts } from '@/features/accounts/hooks/useCompanyAccounts'
import { AccountTree } from '@/features/accounts/components/AccountTree'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { DeleteAccountDialog } from '@/features/accounts/components/DeleteAccountDialog'
import { OpeningEntryModal } from '@/features/companies/components/OpeningEntryModal'
import { ClosingWorkflowModal } from '@/features/companies/components/ClosingWorkflowModal'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { useCompanyClosingState } from '@/features/companies/hooks/useCompanyClosingState'
import { useLogicalExercises } from '@/features/companies/hooks/useLogicalExercises'
import {
  getCompanyStatusLabels,
  getCompanyWriteBlockMessage,
} from '@/features/companies/lib/companyAccounting'
import { Spinner } from '@/shared/ui/Spinner'
import type { Account } from '@/features/accounts/types/account.types'
import { Alert } from '@/shared/ui/Alert'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { Button } from '@/shared/ui/Button'

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const id = Number(companyId)
  const {
    activeCompany: company,
    canManageOpening,
    canManageClosing,
    canWriteCompany,
  } = useActiveCompany(id)

  const { data: accounts = [], isLoading, error } = useCompanyAccounts(id)
  const { data: logicalExercises } = useLogicalExercises(id, { enabled: id > 0 })
  const {
    data: closingState,
    isLoading: closingStateLoading,
    error: closingStateError,
  } = useCompanyClosingState(id, { enabled: id > 0 })
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar el plan de cuentas de la empresa.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para ver el plan de cuentas de esta empresa.',
        notFoundMessage: 'La empresa no existe o ya no está disponible.',
      }),
    [error]
  )
  const closingStateErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(closingStateError, {
        defaultMessage: 'No se pudo cargar el estado de cierre de la empresa.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para consultar el estado de cierre.',
        notFoundMessage: 'La empresa ya no existe o no está disponible.',
      }),
    [closingStateError]
  )

  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Account | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [openingModalOpen, setOpeningModalOpen] = useState(false)
  const [closingModalOpen, setClosingModalOpen] = useState(false)
  const companyStatusLabels = useMemo(() => getCompanyStatusLabels(company), [company])
  const companyWriteBlockMessage = useMemo(() => getCompanyWriteBlockMessage(company), [company])
  const canStartClosing =
    canManageClosing &&
    company?.accounting_ready !== false &&
    company?.is_read_only !== true &&
    (closingState?.can_close ?? true)

  function openCreate(parent: Account) {
    if (!canWriteCompany) return
    setSelectedParent(parent)
    setEditingAccount(null)
    setAccountFormOpen(true)
  }

  function openEdit(account: Account) {
    if (!canWriteCompany) return
    setEditingAccount(account)
    setSelectedParent(null)
    setAccountFormOpen(true)
  }

  function closeForm() {
    setAccountFormOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => void navigate('/companies')}
        className="text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        ← Volver a Empresas
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan de cuentas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administrá las cuentas de movimiento de esta empresa.
        </p>
        {companyStatusLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {companyStatusLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)]"
              >
                {label}
              </span>
            ))}
          </div>
        )}
        {company?.is_demo && company.demo_slug && (
          <p className="muted-text mt-2 text-xs">Slug demo: {company.demo_slug}</p>
        )}
      </div>

      {companyWriteBlockMessage && <Alert tone="warning">{companyWriteBlockMessage}</Alert>}

      <div className="surface-card flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Estado de cierre</p>
            <p className="muted-text mt-1 text-sm">
              Seguimiento del último cierre patrimonial y de la reapertura de libros.
            </p>
          </div>
          {canStartClosing && (
            <Button type="button" onClick={() => setClosingModalOpen(true)}>
              Preparar cierre
            </Button>
          )}
        </div>

        {company?.books_closed_until && (
          <Alert tone="info">
            Los libros están cerrados hasta <strong>{company.books_closed_until}</strong>.
          </Alert>
        )}

        {closingStateLoading && (
          <Spinner className="size-5 text-[var(--brand-500)]" label="Cargando estado de cierre…" />
        )}

        {closingStateError && !closingStateLoading && (
          <Alert tone="error">{closingStateErrorMessage}</Alert>
        )}

        {!closingStateLoading && !closingStateError && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="summary-stat-card">
              <p className="summary-stat-label">Libros cerrados hasta</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.books_closed_until ?? company?.books_closed_until ?? 'Sin cierre'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Último cierre patrimonial</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_patrimonial_closing_date ?? 'Sin registrar'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Última reapertura</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.last_reopening_date ?? 'Sin registrar'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Elegibilidad</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.can_close ? 'Puede cerrar' : 'No disponible'}
              </p>
            </article>
            <article className="summary-stat-card">
              <p className="summary-stat-label">Ejercicio actual</p>
              <p className="summary-stat-value text-[0.95rem]">
                {closingState?.current_exercise
                  ? `#${closingState.current_exercise.exercise_index} · ${closingState.current_exercise.start_date}`
                  : 'Sin ejercicio'}
              </p>
            </article>
          </div>
        )}

        {!canManageClosing &&
          company?.accounting_ready !== false &&
          company?.is_read_only !== true && (
            <p className="muted-text text-sm">
              Solo el propietario o un administrador pueden ejecutar el cierre contable.
            </p>
          )}

        {logicalExercises && logicalExercises.exercises.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-[var(--text-strong)]">Ejercicios lógicos</p>
              <p className="muted-text mt-1 text-sm">
                Secuencia de apertura, cierres patrimoniales y reaperturas resuelta por backend.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {logicalExercises.exercises.map((exercise) => (
                <article
                  key={exercise.exercise_id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--text-strong)]">
                      Ejercicio {exercise.exercise_index}
                    </p>
                    <span className="metric-chip">
                      {exercise.exercise_id === logicalExercises.current_exercise_id
                        ? 'Actual'
                        : exercise.status === 'closed'
                          ? 'Cerrado'
                          : 'Abierto'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
                    <p>Inicio: {exercise.start_date}</p>
                    <p>Cierre: {exercise.closing_date ?? 'Pendiente'}</p>
                    <p>Origen: {exercise.opening_source_type}</p>
                  </div>
                  {exercise.snapshot_id !== null && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          navigate(`/companies/${id}/closing/snapshots/${exercise.snapshot_id}`)
                        }
                      >
                        Ver snapshot confirmado
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {logicalExercises.exercises.some((exercise) => exercise.snapshot_id !== null) && (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/companies/${id}/closing/latest-snapshot`)}
                >
                  Ver último snapshot confirmado
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {company?.accounting_ready === false && canManageOpening && (
        <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">Registrá la apertura contable</p>
            <p className="muted-text mt-1 text-sm">
              La empresa todavía no puede operar en journal ni reportes hasta cargar el inventario
              inicial o general.
            </p>
          </div>
          <Button
            type="button"
            disabled={!canWriteCompany}
            onClick={() => setOpeningModalOpen(true)}
          >
            Registrar apertura
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-blue-600" label="Cargando plan de cuentas…" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {/* Empty */}
      {!isLoading && !error && accounts.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No hay cuentas registradas.</p>
        </div>
      )}

      {/* Tree */}
      {!isLoading && !error && accounts.length > 0 && (
        <AccountTree
          accounts={accounts}
          onAddChild={canWriteCompany ? openCreate : undefined}
          onEdit={canWriteCompany ? openEdit : undefined}
          onDelete={canWriteCompany ? (a) => setDeletingAccount(a) : undefined}
        />
      )}

      {/* Modals */}
      <AccountForm
        isOpen={accountFormOpen}
        onClose={closeForm}
        companyId={id}
        parentAccount={selectedParent ?? undefined}
        account={editingAccount ?? undefined}
      />
      <DeleteAccountDialog
        account={deletingAccount}
        companyId={id}
        onClose={() => setDeletingAccount(null)}
      />
      <OpeningEntryModal
        isOpen={openingModalOpen}
        onClose={() => setOpeningModalOpen(false)}
        companyId={id}
        existingAccounts={accounts}
      />
      <ClosingWorkflowModal
        isOpen={closingModalOpen}
        onClose={() => setClosingModalOpen(false)}
        companyId={id}
        state={closingState}
      />
    </div>
  )
}
