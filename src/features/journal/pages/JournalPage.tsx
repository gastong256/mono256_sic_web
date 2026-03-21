import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { OpeningEntryModal } from '@/features/companies/components/OpeningEntryModal'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, refreshToken } = useAuthStore()
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false)
  const previousCompanyIdRef = useRef<number | null>(null)
  const pageParam = Number(searchParams.get('page') ?? '1')
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const { data, isLoading, isError, error } = useJournalEntries(currentPage, {
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
          !isAccountingReady || isReadOnly ? (accountingBlockMessage ?? undefined) : undefined,
      }),
    [accountingBlockMessage, error, isAccountingReady, isReadOnly]
  )
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 25))
  const entries = data?.results ?? []

  useEffect(() => {
    const previousCompanyId = previousCompanyIdRef.current
    previousCompanyIdRef.current = activeCompanyId

    if (previousCompanyId === null || previousCompanyId === activeCompanyId) return

    setSearchParams((current) => {
      if (current.get('page') === '1' || current.get('page') === null) return current
      const next = new URLSearchParams(current)
      next.set('page', '1')
      return next
    })
  }, [activeCompanyId, setSearchParams])

  function goToPage(page: number) {
    const nextPage = Math.max(1, page)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage === 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }

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
        subtitle="Registro manual paginado de asientos de la empresa activa."
        actions={
          <Button
            disabled={activeCompanyId === null || !isAccountingReady || isReadOnly}
            onClick={() => setIsFormOpen(true)}
          >
            + Nuevo asiento
          </Button>
        }
      />

      {activeCompanyId !== null &&
        activeCompany?.accounting_ready === false &&
        accountingBlockMessage && <Alert tone="warning">{accountingBlockMessage}</Alert>}

      {activeCompanyId !== null && isReadOnly && (
        <Alert tone="info">
          Esta empresa está en modo solo lectura. Podés consultar los asientos, pero no crear ni
          reversar operaciones.
        </Alert>
      )}

      <CompanyBooksClosedAlert booksClosedUntil={booksClosedUntil}>
        {' '}
        Los nuevos asientos deben registrarse con fecha posterior.
      </CompanyBooksClosedAlert>

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

      {!isLoading && !isError && isAccountingReady && entries.length === 0 && (
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

      {!isLoading && isAccountingReady && entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-[var(--border-soft)]/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">Registro manual</p>
              <p className="muted-text text-sm">
                Página {currentPage} de {totalPages}. Mostrando {entries.length} asientos de un
                total de {data?.count ?? entries.length}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={!data?.previous || currentPage <= 1}
                className={
                  data?.previous && currentPage > 1
                    ? 'border border-[var(--border-soft)] bg-white/85'
                    : undefined
                }
                onClick={() => goToPage(currentPage - 1)}
              >
                Ver más recientes
              </Button>
              <Button
                variant="secondary"
                disabled={!data?.next}
                onClick={() => goToPage(currentPage + 1)}
              >
                Ver más antiguos
              </Button>
            </div>
          </div>

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
        </div>
      )}

      {/* New entry modal */}
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
