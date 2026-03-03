import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { CompanyTable } from '@/features/companies/components/CompanyTable'
import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { DeleteCompanyDialog } from '@/features/companies/components/DeleteCompanyDialog'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { Company } from '@/features/companies/types/company.types'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'

export function CompaniesPage() {
  const navigate = useNavigate()
  const { data: companies = [], isLoading, error } = useCompanies()

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
      <PageHeader
        title="Empresas"
        subtitle="Sus empresas registradas."
        actions={<Button onClick={openCreate}>Nueva empresa</Button>}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando empresas..." />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Alert tone="error">Error al cargar las empresas. Intente nuevamente.</Alert>
      )}

      {/* Empty */}
      {!isLoading && !error && companies.length === 0 && (
        <EmptyState
          title="No hay empresas registradas"
          description='Hace clic en "Nueva empresa" para comenzar.'
          action={<Button onClick={openCreate}>Nueva empresa</Button>}
        />
      )}

      {/* Table */}
      {!isLoading && !error && companies.length > 0 && (
        <CompanyTable
          companies={companies}
          showOwner={false}
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
