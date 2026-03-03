import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { CompanyTable } from '@/features/companies/components/CompanyTable'
import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { DeleteCompanyDialog } from '@/features/companies/components/DeleteCompanyDialog'
import { Button } from '@/shared/ui/Button'
import type { Company } from '@/features/companies/types/company.types'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

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
        <div className="surface-card overflow-hidden p-4">
          <div className="mb-3 grid grid-cols-5 gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="grid grid-cols-5 gap-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="ml-auto h-8 w-24" />
              </div>
            ))}
          </div>
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
