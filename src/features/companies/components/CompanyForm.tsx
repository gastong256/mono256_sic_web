import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import type { Company } from '@/features/companies/types/company.types'
import { resolveFormApiError } from '@/shared/lib/formErrors'
import { Alert } from '@/shared/ui/Alert'
import { useToast } from '@/shared/ui/ToastProvider'

// ── Validation schema ─────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  tax_id: z.string().max(20).optional().or(z.literal('')),
})

type CompanyFormValues = z.infer<typeof companySchema>

// ── Component ─────────────────────────────────────────────────────────────────

interface CompanyFormProps {
  isOpen: boolean
  onClose: () => void
  company?: Company
}

export function CompanyForm({ isOpen, onClose, company }: CompanyFormProps) {
  const { pushToast } = useToast()
  const isEditMode = company !== undefined
  const { mutate: createCompany, isPending: isCreating } = useCreateCompany()
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', tax_id: '' },
  })

  useEffect(() => {
    if (company) {
      reset({ name: company.name, tax_id: company.tax_id ?? '' })
    } else {
      reset({ name: '', tax_id: '' })
    }
  }, [company, reset])

  function handleClose() {
    reset({ name: '', tax_id: '' })
    onClose()
  }

  function onSubmit(values: CompanyFormValues) {
    const payload = {
      name: values.name,
      tax_id: values.tax_id || undefined,
    }

    const handleError = (error: unknown) => {
      const apiError = resolveFormApiError(
        error,
        ['name', 'tax_id'] as const,
        'No se pudo guardar la empresa. Intente nuevamente.'
      )
      if (!apiError) return
      if (typeof apiError === 'object') {
        setError(apiError.field, { message: apiError.message })
      } else {
        setError('root', { message: apiError })
      }
    }

    if (isEditMode) {
      updateCompany(
        { id: company.id, payload },
        {
          onSuccess: () => {
            pushToast('Empresa actualizada correctamente.', 'success')
            handleClose()
          },
          onError: handleError,
        }
      )
    } else {
      createCompany(payload, {
        onSuccess: () => {
          pushToast('Empresa creada correctamente.', 'success')
          handleClose()
        },
        onError: handleError,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar empresa' : 'Nueva empresa'}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && <Alert tone="error">{errors.root.message}</Alert>}

        <Input label="Nombre" autoFocus error={errors.name?.message} {...register('name')} />

        <div>
          <Input
            label="CUIT"
            placeholder="Opcional"
            error={errors.tax_id?.message}
            {...register('tax_id')}
          />
          <p className="muted-text mt-1 text-xs">Formato sugerido: 30-12345678-9.</p>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditMode ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
