import { useState } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries'
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard'
import { NewJournalEntryForm } from '@/features/journal/components/NewJournalEntryForm'
import { Spinner } from '@/shared/ui/Spinner'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'

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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500">Seleccioná una empresa para ver los asientos.</p>
      </div>
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
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error al cargar los asientos. Intentá de nuevo.
        </div>
      )}

      {!isLoading && !isError && entries && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-soft)] py-20 text-center">
          <p className="muted-text">No hay asientos registrados.</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-3 text-sm font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)]"
          >
            Crear el primer asiento
          </button>
        </div>
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
