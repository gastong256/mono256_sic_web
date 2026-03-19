import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { CompanyTable } from '@/features/companies/components/CompanyTable'
import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { DeleteCompanyDialog } from '@/features/companies/components/DeleteCompanyDialog'
import { useSetDemoPublication } from '@/features/companies/hooks/useSetDemoPublication'
import { Button } from '@/shared/ui/Button'
import type { Company } from '@/features/companies/types/company.types'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { useToast } from '@/shared/ui/ToastProvider'
import { useAuthStore } from '@/features/auth/store/auth.store'

export function CompaniesPage() {
  const { pushToast } = useToast()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { data: companies = [], isLoading, error } = useCompanies()
  const [publishingCompanyId, setPublishingCompanyId] = useState<number | null>(null)
  const { mutate: setDemoPublication } = useSetDemoPublication()
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudieron cargar las empresas.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente para ver tus empresas.',
        forbiddenMessage: 'No tenés permisos para consultar empresas.',
        serverErrorMessage: 'El servidor no respondió al cargar empresas. Intentá nuevamente.',
      }),
    [error]
  )

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

  function handleToggleDemoPublication(company: Company) {
    if (!company.is_demo) return

    const nextPublished = company.is_published !== true
    setPublishingCompanyId(company.id)
    setDemoPublication(
      {
        companyId: company.id,
        payload: { is_published: nextPublished },
      },
      {
        onSuccess: () => {
          pushToast(
            nextPublished ? 'Demo publicada correctamente.' : 'Demo ocultada correctamente.',
            'success'
          )
          setPublishingCompanyId(null)
        },
        onError: (mutationError) => {
          pushToast(
            getHttpErrorMessage(mutationError, {
              defaultMessage: 'No se pudo actualizar la visibilidad de la demo.',
              forbiddenMessage: 'No tenés permisos para publicar u ocultar demos.',
              notFoundMessage: 'La empresa demo ya no existe o no está disponible.',
            }),
            'error'
          )
          setPublishingCompanyId(null)
        },
      }
    )
  }

  const showOwner = user?.role === 'admin'
  const canManageDemoPublication = user?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Empresas"
        subtitle="Sus empresas registradas."
        icon="companies"
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
      {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {/* Empty */}
      {!isLoading && !error && companies.length === 0 && (
        <EmptyState
          icon="companies"
          title="No hay empresas registradas"
          description='Hace clic en "Nueva empresa" para comenzar.'
          action={<Button onClick={openCreate}>Nueva empresa</Button>}
        />
      )}

      {/* Table */}
      {!isLoading && !error && companies.length > 0 && (
        <CompanyTable
          companies={companies}
          showOwner={showOwner}
          canManageDemoPublication={canManageDemoPublication}
          demoPublicationPendingId={publishingCompanyId}
          onToggleDemoPublication={handleToggleDemoPublication}
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
