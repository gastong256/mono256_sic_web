import { useState } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries'
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard'
import { NewJournalEntryForm } from '@/features/journal/components/NewJournalEntryForm'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Alert } from '@/shared/ui/Alert'
import { Skeleton } from '@/shared/ui/Skeleton'

export function JournalPage() {
  const { accessToken, refreshToken } = useAuthStore()
  const { activeCompanyId } = useActiveCompanyStore()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data: entries, isLoading, isError } = useJournalEntries()
  const isAuthenticated = Boolean(accessToken ?? refreshToken)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (activeCompanyId === null) {
    return (
      <EmptyState
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
        title="Asientos"
        subtitle="Registro cronologico de asientos de la empresa activa."
        actions={<Button onClick={() => setIsFormOpen(true)}>+ Nuevo asiento</Button>}
      />

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

      {isError && <Alert tone="error">Error al cargar los asientos. Intentá de nuevo.</Alert>}

      {!isLoading && !isError && entries && entries.length === 0 && (
        <EmptyState
          title="No hay asientos registrados"
          description="Comenza registrando el primer asiento manual de esta empresa."
          action={<Button onClick={() => setIsFormOpen(true)}>Crear primer asiento</Button>}
          className="py-20"
        />
      )}

      {!isLoading && entries && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} companyId={activeCompanyId} />
          ))}
        </div>
      )}

      {/* New entry modal */}
      <NewJournalEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companyId={activeCompanyId}
      />
    </div>
  )
}
