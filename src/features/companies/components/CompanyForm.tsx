import { useEffect, useState } from 'react'
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
import { OpeningEntryEditor } from '@/features/companies/components/OpeningEntryEditor'
import {
  getDefaultOpeningEntry,
  validateOpeningEntry,
} from '@/features/companies/lib/companyAccounting'
import type { OpeningEntryPayload } from '@/features/companies/types/company.types'

// ── Validation schema ─────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
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
  const [openingEnabled, setOpeningEnabled] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [openingEntry, setOpeningEntry] = useState<OpeningEntryPayload>(getDefaultOpeningEntry)

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', description: '', tax_id: '' },
  })

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        description: company.description ?? '',
        tax_id: company.tax_id ?? '',
      })
      setOpeningEnabled(false)
      setStep(1)
      setOpeningEntry(getDefaultOpeningEntry())
    } else {
      reset({ name: '', description: '', tax_id: '' })
      setOpeningEnabled(false)
      setStep(1)
      setOpeningEntry(getDefaultOpeningEntry())
    }
  }, [company, reset])

  function handleClose() {
    reset({ name: '', description: '', tax_id: '' })
    setOpeningEnabled(false)
    setStep(1)
    setOpeningEntry(getDefaultOpeningEntry())
    onClose()
  }

  async function handleNextStep() {
    clearErrors('root')
    const isValid = await trigger(['name', 'description', 'tax_id'])
    if (!isValid) return
    setStep(2)
  }

  function handleBackStep() {
    clearErrors('root')
    setStep(1)
  }

  function onSubmit(values: CompanyFormValues) {
    if (!isEditMode && openingEnabled) {
      const openingError = validateOpeningEntry(openingEntry)
      if (openingError) {
        setError('root', { message: openingError })
        return
      }
    }

    const payload = {
      name: values.name,
      description: values.description || undefined,
      tax_id: values.tax_id || undefined,
      ...(!isEditMode && openingEnabled ? { opening_entry: openingEntry } : {}),
    }

    const handleError = (error: unknown) => {
      const apiError = resolveFormApiError(
        error,
        ['name', 'description', 'tax_id'] as const,
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
        onSuccess: (createdCompany) => {
          pushToast(
            createdCompany.accounting_ready
              ? 'Empresa creada y lista para operar.'
              : 'Empresa creada. Falta registrar la apertura contable.',
            'success'
          )
          handleClose()
        },
        onError: handleError,
      })
    }
  }

  const isOpeningStep = !isEditMode && openingEnabled && step === 2
  const rootErrorMessage = errors.root?.message ?? null
  const shouldShowRootAlert =
    rootErrorMessage !== null &&
    rootErrorMessage !== 'Completá nombre e importe válido en todos los activos.'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar empresa' : 'Nueva empresa'}
      className={isOpeningStep ? 'xl:max-w-6xl 2xl:max-w-7xl' : ''}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {shouldShowRootAlert && rootErrorMessage && <Alert tone="error">{rootErrorMessage}</Alert>}

        {!isOpeningStep ? (
          <>
            <Input label="Nombre" autoFocus error={errors.name?.message} {...register('name')} />

            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--text-strong)]">
                Descripción
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                placeholder="Opcional"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[var(--danger-600)]">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Input
                label="CUIT"
                placeholder="Opcional"
                error={errors.tax_id?.message}
                {...register('tax_id')}
              />
              <p className="muted-text mt-1 text-xs">Formato sugerido: 30-12345678-9.</p>
            </div>

            {!isEditMode && (
              <div className="space-y-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={openingEnabled}
                    onChange={(event) => {
                      const enabled = event.target.checked
                      setOpeningEnabled(enabled)
                      if (!enabled) {
                        setStep(1)
                        clearErrors('root')
                      }
                    }}
                    className="mt-1 size-4 rounded border-[var(--border-strong)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-strong)]">
                      Registrar apertura ahora
                    </span>
                    <span className="muted-text mt-1 block text-xs">
                      Si activás esta opción, la empresa se crea ya lista para usar asientos
                      contables y reportes.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="px-4 xl:px-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-xl font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
                  {getValues('name') || 'Nueva empresa'}
                </p>
                {getValues('tax_id') ? (
                  <span className="text-sm font-medium text-[var(--text-muted)]">
                    CUIT/CUIL: {getValues('tax_id')}
                  </span>
                ) : getValues('description') ? (
                  <span className="text-sm text-[var(--text-muted)]">
                    {getValues('description')}
                  </span>
                ) : null}
              </div>
            </div>

            <OpeningEntryEditor
              value={openingEntry}
              onChange={setOpeningEntry}
              disabled={isPending}
            />
          </div>
        )}

        <div
          className={[
            'flex gap-3',
            isOpeningStep ? 'justify-between pt-1' : 'justify-end pt-1',
          ].join(' ')}
        >
          {isOpeningStep ? (
            <Button type="button" variant="secondary" onClick={handleBackStep} disabled={isPending}>
              Volver
            </Button>
          ) : null}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>

            {isOpeningStep ? (
              <Button type="submit" isLoading={isPending}>
                Crear empresa y apertura
              </Button>
            ) : isEditMode ? (
              <Button type="submit" isLoading={isPending}>
                Guardar cambios
              </Button>
            ) : openingEnabled ? (
              <Button type="button" onClick={() => void handleNextStep()} disabled={isPending}>
                Continuar
              </Button>
            ) : (
              <Button type="submit" isLoading={isPending}>
                Crear empresa
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
