import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { CompanyTable } from '@/features/companies/components/CompanyTable'
import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { DeleteCompanyDialog } from '@/features/companies/components/DeleteCompanyDialog'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { Company } from '@/features/companies/types/company.types'

export function CompaniesPage() {
  const navigate = useNavigate()
  const { data: companies = [], isLoading, error } = useCompanies()
  const isStaff = useAuthStore((s) => s.user?.is_staff ?? false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)

  function openCreate() {
    setEditingCompany(null)
    setFormOpen(true)
  }

  function openEdit(company: Company) {
    setEditingCompany(company)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isStaff ? 'Todas las empresas registradas.' : 'Sus empresas registradas.'}
          </p>
        </div>
        <Button onClick={openCreate}>Nueva empresa</Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-blue-600" label="Cargando empresas…" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Error al cargar las empresas. Intente nuevamente.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && companies.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No hay empresas registradas.</p>
          <p className="mt-1 text-xs text-gray-400">
            Haga clic en &quot;Nueva empresa&quot; para comenzar.
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && companies.length > 0 && (
        <CompanyTable
          companies={companies}
          isStaff={isStaff}
          onView={(c) => void navigate(`/companies/${c.id}`)}
          onEdit={openEdit}
          onDelete={(c) => setDeletingCompany(c)}
        />
      )}

      {/* Modals */}
      <CompanyForm isOpen={formOpen} onClose={closeForm} company={editingCompany ?? undefined} />
      <DeleteCompanyDialog company={deletingCompany} onClose={() => setDeletingCompany(null)} />
    </div>
  )
}
