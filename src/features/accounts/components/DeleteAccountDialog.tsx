import { useState } from 'react'
import type { AxiosError } from 'axios'
import { Modal } from '@/shared/ui/Modal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/Button'
import { useDeleteAccount } from '@/features/accounts/hooks/useDeleteAccount'
import type { Account } from '@/features/accounts/types/account.types'

interface DeleteAccountDialogProps {
  account: Account | null
  companyId: number
  onClose: () => void
}

export function DeleteAccountDialog({ account, companyId, onClose }: DeleteAccountDialogProps) {
  const { mutate: deleteAccount, isPending } = useDeleteAccount(companyId)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  function handleClose() {
    setConflictMessage(null)
    onClose()
  }

  function handleConfirm() {
    if (!account) return
    deleteAccount(account.id, {
      onSuccess: handleClose,
      onError: (error) => {
        const axiosErr = error as AxiosError<{ detail?: string }>
        if (axiosErr.response?.status === 409) {
          setConflictMessage(
            axiosErr.response.data?.detail ??
              'Esta cuenta tiene movimientos registrados y no puede eliminarse.'
          )
        }
      },
    })
  }

  if (conflictMessage) {
    return (
      <Modal isOpen={account !== null} onClose={handleClose} title="No se puede eliminar">
        <div className="space-y-5">
          <div
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {conflictMessage}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <ConfirmDialog
      isOpen={account !== null}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Eliminar subcuenta"
      message={
        <>
          ¿Desea eliminar la subcuenta <strong className="font-semibold">{account?.name}</strong>?
          Esta acción no se puede deshacer.
        </>
      }
      confirmLabel="Eliminar"
      isLoading={isPending}
      variant="danger"
    />
  )
}
