import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCompanyAccounts } from '@/features/accounts/hooks/useCompanyAccounts'
import { AccountTree } from '@/features/accounts/components/AccountTree'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { DeleteAccountDialog } from '@/features/accounts/components/DeleteAccountDialog'
import { OpeningEntryModal } from '@/features/companies/components/OpeningEntryModal'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import {
  filterAccountsForOpening,
  getCompanyStatusLabels,
  getCompanyWriteBlockMessage,
} from '@/features/companies/lib/companyAccounting'
import { Spinner } from '@/shared/ui/Spinner'
import type { Account } from '@/features/accounts/types/account.types'
import { Alert } from '@/shared/ui/Alert'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'

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
  const visibleAccounts = useMemo(
    () => (company?.accounting_ready === false ? filterAccountsForOpening(accounts) : accounts),
    [accounts, company?.accounting_ready]
  )

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
    <div className="page-shell">
      <PageHeader
        icon="companies"
        title="Plan de cuentas"
        subtitle="Administrá las cuentas de movimiento, el seguimiento del cierre contable y la apertura de esta empresa."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => void navigate('/companies')}>
              Volver a empresas
            </Button>
          </>
        }
      />

      <section className="space-y-1 border-b border-[var(--border-soft)]/80 pb-3">
        <p className="text-lg font-semibold tracking-tight text-[var(--text-strong)] sm:text-xl">
          {company?.name ?? 'Empresa seleccionada'}
        </p>
        <p className="muted-text max-w-3xl text-sm sm:text-[0.95rem]">
          {company?.description ||
            'Revisá el estado contable y la estructura operativa de la empresa.'}
        </p>
        {company?.tax_id && (
          <p className="muted-text text-sm sm:text-[0.95rem]">CUIT/CUIL: {company.tax_id}</p>
        )}
        {companyStatusLabels.filter((label) => label !== 'Pendiente de apertura').length > 0 && (
          <div className="page-meta-row mt-3">
            {companyStatusLabels
              .filter((label) => label !== 'Pendiente de apertura')
              .map((label) => (
                <span key={label} className="status-badge">
                  {label}
                </span>
              ))}
          </div>
        )}
        {company?.is_demo && company.demo_slug && (
          <p className="muted-text mt-2 text-xs">Slug de demo: {company.demo_slug}</p>
        )}
      </section>

      {companyWriteBlockMessage && (
        <Alert tone="warning">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Registrá la apertura contable</p>
              <p className="mt-1">
                La empresa todavía no puede operar en asientos contables ni reportes hasta cargar el
                inventario inicial o general.
              </p>
            </div>
            {company?.accounting_ready === false && canManageOpening && (
              <Button
                type="button"
                variant="secondary"
                className="border border-amber-500 bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-white shadow-[0_12px_24px_-16px_rgba(180,83,9,0.85)] hover:border-amber-600 hover:text-white hover:brightness-105 focus-visible:ring-amber-500"
                disabled={!canWriteCompany}
                onClick={() => setOpeningModalOpen(true)}
              >
                Registrar apertura
              </Button>
            )}
          </div>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-blue-600" label="Cargando plan de cuentas…" />
        </div>
      )}

      {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {!isLoading && !error && visibleAccounts.length === 0 && (
        <div className="page-section rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">
            {company?.accounting_ready === false
              ? 'No hay cuentas válidas disponibles para registrar la apertura.'
              : 'No hay cuentas registradas.'}
          </p>
        </div>
      )}

      {!isLoading && !error && visibleAccounts.length > 0 && (
        <AccountTree
          accounts={visibleAccounts}
          onAddChild={canWriteCompany ? openCreate : undefined}
          onEdit={canWriteCompany ? openEdit : undefined}
          onDelete={canWriteCompany ? (a) => setDeletingAccount(a) : undefined}
        />
      )}

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
        existingAccounts={visibleAccounts}
      />
    </div>
  )
}
