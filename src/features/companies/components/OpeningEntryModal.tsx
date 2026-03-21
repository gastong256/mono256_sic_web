import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/ToastProvider'
import { OpeningEntryEditor } from '@/features/companies/components/OpeningEntryEditor'
import { useCreateOpeningEntry } from '@/features/companies/hooks/useCreateOpeningEntry'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import {
  getDefaultOpeningEntry,
  validateOpeningEntry,
} from '@/features/companies/lib/companyAccounting'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import type { OpeningEntryPayload } from '@/features/companies/types/company.types'
import type { Account } from '@/features/accounts/types/account.types'

interface OpeningEntryModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: number
  existingAccounts?: Account[]
}

export function OpeningEntryModal({
  isOpen,
  onClose,
  companyId,
  existingAccounts,
}: OpeningEntryModalProps) {
  const { pushToast } = useToast()
  const { activeCompany } = useActiveCompany(companyId)
  const mutation = useCreateOpeningEntry(companyId)
  const [openingEntry, setOpeningEntry] = useState<OpeningEntryPayload>(getDefaultOpeningEntry)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleClose() {
    setSubmitError(null)
    setOpeningEntry(getDefaultOpeningEntry())
    onClose()
  }

  async function handleSubmit() {
    const validationError = validateOpeningEntry(openingEntry)
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    try {
      await mutation.mutateAsync(openingEntry)
      pushToast('Apertura registrada correctamente.', 'success')
      handleClose()
    } catch (error) {
      setSubmitError(
        getHttpErrorMessage(error, {
          defaultMessage: 'No se pudo registrar la apertura contable.',
          badRequestMessage: 'Revisá los datos cargados e intentá nuevamente.',
          unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
          forbiddenMessage: 'No tenés permisos para registrar la apertura.',
          notFoundMessage: 'La empresa ya no existe o no está disponible.',
        })
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar apertura contable"
      className="xl:max-w-6xl 2xl:max-w-7xl"
    >
      <div className="space-y-5">
        {submitError && <Alert tone="error">{submitError}</Alert>}

        <div className="px-4 lg:px-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-xl font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
              {activeCompany?.name ?? 'Empresa'}
            </p>
            {activeCompany?.tax_id ? (
              <span className="text-sm font-medium text-[var(--text-muted)]">
                CUIT/CUIL: {activeCompany.tax_id}
              </span>
            ) : activeCompany?.description ? (
              <span className="text-sm text-[var(--text-muted)]">{activeCompany.description}</span>
            ) : null}
          </div>
        </div>

        <OpeningEntryEditor
          value={openingEntry}
          onChange={setOpeningEntry}
          existingAccounts={existingAccounts}
          disabled={mutation.isPending}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button type="button" isLoading={mutation.isPending} onClick={() => void handleSubmit()}>
            Registrar apertura
          </Button>
        </div>
      </div>
    </Modal>
  )
}
