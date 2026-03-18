import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { getCompanyAccountingBlockMessage } from '@/features/companies/lib/companyAccounting'
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries'
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard'
import { NewJournalEntryForm } from '@/features/journal/components/NewJournalEntryForm'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Alert } from '@/shared/ui/Alert'
import { Skeleton } from '@/shared/ui/Skeleton'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'

export function JournalPage() {
  const navigate = useNavigate()
  const { accessToken, refreshToken } = useAuthStore()
  const {
    activeCompanyId,
    activeCompany,
    canManageOpening,
    canWriteCompany,
    isLoading: companyLoading,
  } = useActiveCompany()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const isAccountingReady = activeCompany?.accounting_ready !== false
  const isReadOnly = activeCompany?.is_read_only === true

  const {
    data: entries,
    isLoading,
    isError,
    error,
  } = useJournalEntries({
    enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
  })
  const isAuthenticated = Boolean(accessToken ?? refreshToken)
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudieron cargar los asientos de la empresa activa.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para ver estos asientos.',
        notFoundMessage: 'La empresa activa no existe o ya no está disponible.',
        conflictMessage:
          activeCompany?.accounting_ready === false || activeCompany?.is_read_only
            ? getCompanyAccountingBlockMessage(activeCompany)
            : undefined,
      }),
    [activeCompany, error]
  )

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (activeCompanyId === null) {
    return (
      <EmptyState
        icon="companies"
        title="Selecciona una empresa"
        description="Necesitas una empresa activa para ver y registrar asientos."
        className="py-24"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        icon="journal"
        title="Asientos"
        subtitle="Registro cronologico de asientos de la empresa activa."
        actions={
          <Button
            disabled={activeCompanyId === null || !isAccountingReady || isReadOnly}
            onClick={() => setIsFormOpen(true)}
          >
            + Nuevo asiento
          </Button>
        }
      />

      {activeCompanyId !== null && activeCompany?.accounting_ready === false && (
        <Alert tone="warning">
          {getCompanyAccountingBlockMessage(activeCompany)}
          {canManageOpening && canWriteCompany && (
            <>
              {' '}
              Podés registrar la apertura desde{' '}
              <button
                type="button"
                onClick={() => navigate(`/companies/${activeCompanyId}`)}
                className="font-semibold underline"
              >
                plan de cuentas
              </button>
              .
            </>
          )}
        </Alert>
      )}

      {activeCompanyId !== null && isReadOnly && (
        <Alert tone="info">
          Esta empresa está en modo solo lectura. Podés consultar los asientos, pero no crear ni
          reversar operaciones.
        </Alert>
      )}

      {activeCompanyId !== null && activeCompany?.books_closed_until && (
        <Alert tone="info">
          Los libros están cerrados hasta <strong>{activeCompany.books_closed_until}</strong>. Los
          nuevos asientos deben registrarse con fecha posterior.
        </Alert>
      )}

      {/* Content */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="surface-card overflow-hidden p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-10/12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && <Alert tone="error">{loadErrorMessage}</Alert>}

      {activeCompanyId !== null && activeCompany?.accounting_ready === false && !isError && (
        <EmptyState
          icon="journal"
          title="Pendiente de apertura contable"
          description={getCompanyAccountingBlockMessage(activeCompany)}
          action={
            canManageOpening && canWriteCompany ? (
              <Button onClick={() => navigate(`/companies/${activeCompanyId}`)}>
                Registrar apertura
              </Button>
            ) : undefined
          }
          className="py-20"
        />
      )}

      {!isLoading && !isError && isAccountingReady && entries && entries.length === 0 && (
        <EmptyState
          icon="journal"
          title="No hay asientos registrados"
          description="Comenza registrando el primer asiento manual de esta empresa."
          action={
            !isReadOnly ? (
              <Button onClick={() => setIsFormOpen(true)}>Crear primer asiento</Button>
            ) : undefined
          }
          className="py-20"
        />
      )}

      {!isLoading && isAccountingReady && entries && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              companyId={activeCompanyId}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* New entry modal */}
      <NewJournalEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companyId={activeCompanyId}
        company={activeCompany}
      />
    </div>
  )
}
