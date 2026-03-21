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
import { hasRole } from '@/shared/lib/authorization'

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
  const orderedCompanies = useMemo(() => {
    return [...companies].sort((left, right) => {
      const leftIsOwn = left.owner_username === user?.username
      const rightIsOwn = right.owner_username === user?.username

      if (leftIsOwn !== rightIsOwn) return leftIsOwn ? -1 : 1

      const ownerOrder = left.owner_username.localeCompare(right.owner_username, 'es', {
        sensitivity: 'base',
      })
      if (ownerOrder !== 0) return ownerOrder

      const leftPendingOpening = left.accounting_ready === false
      const rightPendingOpening = right.accounting_ready === false
      if (leftPendingOpening !== rightPendingOpening) {
        return leftPendingOpening ? 1 : -1
      }

      return left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })
    })
  }, [companies, user?.username])

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

  const showOwner = hasRole(user, ['admin', 'teacher'])
  const canManageDemoPublication = user?.role === 'admin'
  const showSummaryStats = hasRole(user, ['admin'])
  const demoCompaniesCount = orderedCompanies.filter((company) => company.is_demo).length
  const blockedCompaniesCount = orderedCompanies.filter(
    (company) => company.accounting_ready === false || company.is_read_only === true
  ).length

  return (
    <div className="page-shell">
      <PageHeader
        title="Empresas"
        subtitle="Administrá las empresas disponibles, su estado operativo y, si sos admin, la publicación de demos."
        icon="companies"
        actions={<Button onClick={openCreate}>Nueva empresa</Button>}
      />

      {!isLoading && !error && orderedCompanies.length > 0 && showSummaryStats && (
        <section className="grid gap-3 md:grid-cols-3">
          <article className="summary-stat-card">
            <p className="summary-stat-label">Empresas visibles</p>
            <p className="summary-stat-value">{orderedCompanies.length}</p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Empresas demo</p>
            <p className="summary-stat-value">{demoCompaniesCount}</p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Con restricciones</p>
            <p className="summary-stat-value">{blockedCompaniesCount}</p>
          </article>
        </section>
      )}

      {isLoading && (
        <div className="page-section overflow-hidden">
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

      {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {!isLoading && !error && orderedCompanies.length === 0 && (
        <EmptyState
          icon="companies"
          title="No hay empresas registradas"
          description='Hace clic en "Nueva empresa" para comenzar.'
          action={<Button onClick={openCreate}>Nueva empresa</Button>}
        />
      )}

      {!isLoading && !error && orderedCompanies.length > 0 && (
        <CompanyTable
          companies={orderedCompanies}
          showOwner={showOwner}
          canManageDemoPublication={canManageDemoPublication}
          demoPublicationPendingId={publishingCompanyId}
          onToggleDemoPublication={handleToggleDemoPublication}
          onView={(c) => void navigate(`/companies/${c.id}`)}
          onEdit={openEdit}
          onDelete={(c) => setDeletingCompany(c)}
        />
      )}

      <CompanyForm isOpen={formOpen} onClose={closeForm} company={editingCompany ?? undefined} />
      <DeleteCompanyDialog company={deletingCompany} onClose={() => setDeletingCompany(null)} />
    </div>
  )
}
