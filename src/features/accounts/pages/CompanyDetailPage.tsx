import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCompanyAccounts } from '@/features/accounts/hooks/useCompanyAccounts'
import { AccountTree } from '@/features/accounts/components/AccountTree'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { DeleteAccountDialog } from '@/features/accounts/components/DeleteAccountDialog'
import { OpeningEntryModal } from '@/features/companies/components/OpeningEntryModal'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
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
  const { activeCompany: company, canManageOpening, canWriteCompany } = useActiveCompany(id)

  const { data: accounts = [], isLoading, error } = useCompanyAccounts(id)
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

  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Account | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [openingModalOpen, setOpeningModalOpen] = useState(false)
  const companyStatusLabels = useMemo(() => getCompanyStatusLabels(company), [company])
  const companyWriteBlockMessage = useMemo(() => getCompanyWriteBlockMessage(company), [company])

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
      </div>

      {companyWriteBlockMessage && <Alert tone="warning">{companyWriteBlockMessage}</Alert>}

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
    </div>
  )
}
