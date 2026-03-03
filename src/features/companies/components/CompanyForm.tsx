import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import type { Company } from '@/features/companies/types/company.types'
import { Alert } from '@/shared/ui/Alert'

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

  function extractApiError(
    error: unknown
  ): { field: keyof CompanyFormValues; message: string } | string | null {
    const axiosErr = error as AxiosError<Record<string, string | string[]>>
    const data = axiosErr.response?.data
    if (!data) return null
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.name === 'string') return { field: 'name', message: data.name }
    if (Array.isArray(data.name)) return { field: 'name', message: data.name[0] }
    if (typeof data.tax_id === 'string') return { field: 'tax_id', message: data.tax_id }
    if (Array.isArray(data.tax_id)) return { field: 'tax_id', message: data.tax_id[0] }
    return 'Error inesperado. Intente nuevamente.'
  }

  function onSubmit(values: CompanyFormValues) {
    const payload = {
      name: values.name,
      tax_id: values.tax_id || undefined,
    }

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
      updateCompany({ id: company.id, payload }, { onSuccess: handleClose, onError: handleError })
    } else {
      createCompany(payload, { onSuccess: handleClose, onError: handleError })
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
