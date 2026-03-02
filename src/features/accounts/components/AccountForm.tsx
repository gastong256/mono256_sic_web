import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useCreateAccount } from '@/features/accounts/hooks/useCreateAccount'
import { useUpdateAccount } from '@/features/accounts/hooks/useUpdateAccount'
import type { Account } from '@/features/accounts/types/account.types'

// ── Validation schema ─────────────────────────────────────────────────────────

const accountSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  code: z.string().min(1, 'El código es obligatorio').max(20),
})

type AccountFormValues = z.infer<typeof accountSchema>

// ── Component ─────────────────────────────────────────────────────────────────

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  companyId: number
  parentAccount?: Account
  account?: Account
}

export function AccountForm({
  isOpen,
  onClose,
  companyId,
  parentAccount,
  account,
}: AccountFormProps) {
  const isEditMode = account !== undefined
  const { mutate: createAccount, isPending: isCreating } = useCreateAccount(companyId)
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount(companyId)
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', code: '' },
  })

  useEffect(() => {
    if (account) {
      reset({ name: account.name, code: account.code })
    } else {
      reset({ name: '', code: '' })
    }
  }, [account, reset])

  function handleClose() {
    reset({ name: '', code: '' })
    onClose()
  }

  function extractApiError(
    error: unknown
  ): { field: keyof AccountFormValues; message: string } | string | null {
    const axiosErr = error as AxiosError<Record<string, string | string[]>>
    const data = axiosErr.response?.data
    if (!data) return null
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.name === 'string') return { field: 'name', message: data.name }
    if (Array.isArray(data.name)) return { field: 'name', message: data.name[0] }
    if (typeof data.code === 'string') return { field: 'code', message: data.code }
    if (Array.isArray(data.code)) return { field: 'code', message: data.code[0] }
    return 'Error inesperado. Intente nuevamente.'
  }

  function onSubmit(values: AccountFormValues) {
    const handleError = (error: unknown) => {
      const apiError = extractApiError(error)
      if (!apiError) return
      if (typeof apiError === 'object') {
        setError(apiError.field, { message: apiError.message })
      } else {
        setError('root', { message: apiError })
      }
    }

    if (isEditMode) {
      updateAccount(
        { accountId: account.id, payload: { name: values.name, code: values.code } },
        { onSuccess: handleClose, onError: handleError }
      )
    } else {
      createAccount(
        { name: values.name, code: values.code, parent_id: parentAccount?.id },
        { onSuccess: handleClose, onError: handleError }
      )
    }
  }

  const modalTitle = isEditMode ? 'Editar subcuenta' : 'Nueva subcuenta'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errors.root.message}
          </div>
        )}

        {/* Parent account display (create mode only) */}
        {!isEditMode && parentAccount && (
          <div className="rounded-md bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Cuenta padre</p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {parentAccount.code} — {parentAccount.name}
            </p>
          </div>
        )}

        <Input label="Nombre" autoFocus error={errors.name?.message} {...register('name')} />

        <Input
          label="Código"
          placeholder="Ej: 1.04.01"
          error={errors.code?.message}
          {...register('code')}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditMode ? 'Guardar cambios' : 'Crear subcuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
