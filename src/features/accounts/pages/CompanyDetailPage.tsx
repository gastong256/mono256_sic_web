import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCompanyAccounts } from '@/features/accounts/hooks/useCompanyAccounts'
import { AccountTree } from '@/features/accounts/components/AccountTree'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { DeleteAccountDialog } from '@/features/accounts/components/DeleteAccountDialog'
import { useAccountChartConfig } from '@/features/settings/hooks/useAccountChartConfig'
import { applyChartVisibility } from '@/shared/lib/accountTreeVisibility'
import { Spinner } from '@/shared/ui/Spinner'
import type { Account } from '@/features/accounts/types/account.types'

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const id = Number(companyId)

  const { data: accounts = [], isLoading, error } = useCompanyAccounts(id)
  const { data: chartConfig = [] } = useAccountChartConfig()
  const visibleAccounts = applyChartVisibility(accounts, chartConfig)

  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Account | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)

  function openCreate(parent: Account) {
    setSelectedParent(parent)
    setEditingAccount(null)
    setAccountFormOpen(true)
  }

  function openEdit(account: Account) {
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
          Administrá las subcuentas (nivel 3) de esta empresa.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-blue-600" label="Cargando plan de cuentas…" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Error al cargar el plan de cuentas. Intente nuevamente.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && visibleAccounts.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No hay cuentas registradas.</p>
        </div>
      )}

      {/* Tree */}
      {!isLoading && !error && visibleAccounts.length > 0 && (
        <AccountTree
          accounts={visibleAccounts}
          onAddChild={openCreate}
          onEdit={openEdit}
          onDelete={(a) => setDeletingAccount(a)}
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
    </div>
  )
}
