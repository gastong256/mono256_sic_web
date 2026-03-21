import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { OpeningEntryModal } from '@/features/companies/components/OpeningEntryModal'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard'
import { NewJournalEntryForm } from '@/features/journal/components/NewJournalEntryForm'
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'

export function HomePage() {
  const navigate = useNavigate()
  const { accessToken, refreshToken } = useAuthStore()
  const isAuthenticated = Boolean(accessToken ?? refreshToken)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false)
  const {
    activeCompanyId,
    activeCompany,
    canManageOpening,
    canWriteCompany,
    isAccountingReady,
    isReadOnly,
    booksClosedUntil,
    accountingBlockMessage,
    isLoading: companyLoading,
  } = useActiveCompany()

  const { data, isLoading, isError, error } = useJournalEntries(1, {
    enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
  })

  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar la actividad reciente de la empresa activa.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para ver esta actividad.',
        notFoundMessage: 'La empresa activa no existe o ya no está disponible.',
        conflictMessage:
          !isAccountingReady || isReadOnly ? (accountingBlockMessage ?? undefined) : undefined,
      }),
    [accountingBlockMessage, error, isAccountingReady, isReadOnly]
  )

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (activeCompanyId === null) {
    return (
      <EmptyState
        icon="companies"
        title="Seleccioná una empresa"
        description="Necesitás una empresa activa para consultar la actividad reciente."
        action={<Button onClick={() => navigate('/companies')}>Ir a empresas</Button>}
        className="py-24"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="journal"
        title="Inicio"
        subtitle="Vista rápida de la actividad reciente de la empresa activa."
        actions={
          <Button
            disabled={activeCompanyId === null || !isAccountingReady || isReadOnly}
            onClick={() => setIsFormOpen(true)}
          >
            + Nuevo asiento
          </Button>
        }
      />

      {activeCompany?.accounting_ready === false && accountingBlockMessage && (
        <Alert tone="warning">{accountingBlockMessage}</Alert>
      )}

      {activeCompanyId !== null && isReadOnly && (
        <Alert tone="info">
          Esta empresa está en modo solo lectura. Podés revisar la actividad reciente y consultar el
          detalle completo desde registro manual.
        </Alert>
      )}

      <CompanyBooksClosedAlert booksClosedUntil={booksClosedUntil} />

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

      {!isError && (
        <CompanyPendingOpeningState
          company={activeCompany}
          icon="journal"
          action={
            canManageOpening && canWriteCompany ? (
              <Button onClick={() => setIsOpeningModalOpen(true)}>Registrar apertura</Button>
            ) : undefined
          }
          className="py-20"
        />
      )}

      {!isLoading && !isError && isAccountingReady && data && data.results.length === 0 && (
        <EmptyState
          icon="journal"
          title="No hay actividad reciente"
          description="Todavía no hay asientos registrados para la empresa activa."
          action={<Button onClick={() => navigate('/journal')}>Ir a registro manual</Button>}
          className="py-20"
        />
      )}

      {!isLoading && !isError && isAccountingReady && data && data.results.length > 0 && (
        <div className="space-y-4">
          <section className="flex flex-col gap-3 border-b border-[var(--border-soft)]/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">Actividad reciente</p>
              <p className="muted-text text-sm">
                Mostrando los últimos {data.results.length} asientos de un total de {data.count}.
              </p>
            </div>
            {data.next && (
              <Link
                to="/journal"
                className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm font-semibold text-[var(--brand-700)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--brand-700)]"
              >
                Ver historial completo
              </Link>
            )}
          </section>

          <div className="space-y-3">
            {data.results.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                companyId={activeCompanyId}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      )}

      <NewJournalEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companyId={activeCompanyId}
        company={activeCompany}
      />

      {activeCompanyId !== null && (
        <OpeningEntryModal
          isOpen={isOpeningModalOpen}
          onClose={() => setIsOpeningModalOpen(false)}
          companyId={activeCompanyId}
        />
      )}
    </div>
  )
}
