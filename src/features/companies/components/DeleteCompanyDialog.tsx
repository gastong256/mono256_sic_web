import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useDeleteCompany } from '@/features/companies/hooks/useDeleteCompany'
import type { Company } from '@/features/companies/types/company.types'
import { useToast } from '@/shared/ui/ToastProvider'

interface DeleteCompanyDialogProps {
  company: Company | null
  onClose: () => void
}

export function DeleteCompanyDialog({ company, onClose }: DeleteCompanyDialogProps) {
  const { pushToast } = useToast()
  const { mutate: deleteCompany, isPending } = useDeleteCompany()

  function handleConfirm() {
    if (!company) return
    deleteCompany(company.id, {
      onSuccess: () => {
        pushToast('Empresa eliminada.', 'success')
        onClose()
      },
      onError: () => {
        pushToast('No se pudo eliminar la empresa.', 'error')
      },
    })
  }

  return (
    <ConfirmDialog
      isOpen={company !== null}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Eliminar empresa"
      message={
        <>
          ¿Está seguro que desea eliminar la empresa{' '}
          <strong className="font-semibold">{company?.name}</strong>? Esta acción no se puede
          deshacer.
        </>
      }
      confirmLabel="Eliminar"
      isLoading={isPending}
      variant="danger"
    />
  )
}
