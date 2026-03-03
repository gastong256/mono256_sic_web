import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useCreateJournalEntry } from '@/features/journal/hooks/useCreateJournalEntry'
import { useJournalAccounts } from '@/features/journal/hooks/useJournalAccounts'
import type { CreateJournalLinePayload } from '@/features/journal/types/journal.types'
import { Alert } from '@/shared/ui/Alert'

// ── Zod schema ────────────────────────────────────────────────────────────────

const lineSchema = z
  .object({
    account: z.coerce.number({ invalid_type_error: 'Requerido' }).positive('Seleccioná una cuenta'),
    debe: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importe inválido'),
    haber: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importe inválido'),
  })
  .refine((l) => Number(l.debe) > 0 || Number(l.haber) > 0, {
    message: 'Debe ingresar un importe',
    path: ['debe'],
  })
  .refine((l) => !(Number(l.debe) > 0 && Number(l.haber) > 0), {
    message: 'Solo un lado por línea',
    path: ['debe'],
  })

const schema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  description: z.string().min(1, 'La descripción es obligatoria').max(500),
  lines: z.array(lineSchema).min(2, 'Mínimo 2 líneas'),
})

type FormValues = z.infer<typeof schema>

const defaultLine = { account: 0, debe: '0.00', haber: '0.00' }

// ── ARS formatter ─────────────────────────────────────────────────────────────

const arsFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

function formatARS(value: number): string {
  return arsFormat.format(value)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NewJournalEntryFormProps {
  isOpen: boolean
  onClose: () => void
  companyId: number
}

export function NewJournalEntryForm({ isOpen, onClose, companyId }: NewJournalEntryFormProps) {
  const studentMutation = useCreateJournalEntry(companyId)
  const mutateAsync = studentMutation.mutateAsync
  const isPending = studentMutation.isPending
  const { data: accounts, isLoading: accountsLoading } = useJournalAccounts(companyId)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      description: '',
      lines: [defaultLine, defaultLine],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' }) ?? []

  // ── Balance ──────────────────────────────────────────────────────────────────
  const totalDebe = watchedLines.reduce((sum, l) => sum + (Number(l?.debe) || 0), 0)
  const totalHaber = watchedLines.reduce((sum, l) => sum + (Number(l?.haber) || 0), 0)
  const diferencia = totalDebe - totalHaber
  const isBalanced = Math.abs(diferencia) < 0.001

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null)
      reset({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        lines: [defaultLine, defaultLine],
      })
    }
  }, [isOpen, reset])

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const normalizedLines: CreateJournalLinePayload[] = []

    values.lines.forEach((l) => {
      const debe = Number(l.debe)
      const haber = Number(l.haber)

      if (debe > 0) {
        normalizedLines.push({ account_id: l.account, type: 'DEBIT', amount: l.debe })
      }
      if (haber > 0) {
        normalizedLines.push({ account_id: l.account, type: 'CREDIT', amount: l.haber })
      }
    })

    try {
      await mutateAsync({
        date: values.date,
        description: values.description,
        lines: normalizedLines,
      })
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el asiento.')
    }
  }

  return (
    <Modal title="Nuevo asiento" isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-5"
      >
        {submitError && <Alert tone="error">{submitError}</Alert>}

        {/* Date + Description */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--text-strong)]">
              Fecha
            </label>
            <Input type="date" {...register('date')} />
            {errors.date && (
              <p className="mt-1 text-xs text-[var(--danger-600)]">{errors.date.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--text-strong)]">
              Descripcion
            </label>
            <Input placeholder="Concepto del asiento" {...register('description')} />
            {errors.description && (
              <p className="mt-1 text-xs text-[var(--danger-600)]">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Lines table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-strong)]">Lineas</span>
            <Button type="button" variant="ghost" onClick={() => append(defaultLine)}>
              + Agregar linea
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-subtle)]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                    Cuenta
                  </th>
                  <th className="w-36 px-3 py-2 text-right text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                    Debe
                  </th>
                  <th className="w-36 px-3 py-2 text-right text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                    Haber
                  </th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    {/* Account select */}
                    <td className="px-3 py-2">
                      <select
                        {...register(`lines.${index}.account`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-[var(--border-strong)] bg-white px-2 py-1 text-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                      >
                        <option value={0}>Seleccionar cuenta...</option>
                        {accountsLoading && <option disabled>Cargando...</option>}
                        {accounts?.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[index]?.account && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errors.lines[index].account?.message}
                        </p>
                      )}
                    </td>

                    {/* Debe */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...register(`lines.${index}.debe`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            if (Number(e.target.value) > 0) {
                              setValue(`lines.${index}.haber`, '0.00')
                            }
                          },
                        })}
                        className="w-full rounded-md border border-[var(--border-strong)] px-2 py-1 text-right text-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                      />
                      {errors.lines?.[index]?.debe && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errors.lines[index].debe?.message}
                        </p>
                      )}
                    </td>

                    {/* Haber */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...register(`lines.${index}.haber`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            if (Number(e.target.value) > 0) {
                              setValue(`lines.${index}.debe`, '0.00')
                            }
                          },
                        })}
                        className="w-full rounded-md border border-[var(--border-strong)] px-2 py-1 text-right text-sm focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-2 text-center">
                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar linea"
                        >
                          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.lines?.root && (
            <p className="mt-1 text-xs text-[var(--danger-600)]">{errors.lines.root.message}</p>
          )}
          <p className="muted-text mt-2 text-xs">
            Regla: cada linea debe tener valor en Debe o Haber, nunca en ambos.
          </p>
        </div>

        {/* Balance bar */}
        <div
          className={[
            'rounded-lg border px-4 py-3',
            isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
          ].join(' ')}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <span>
                <span className="text-gray-500">Debe: </span>
                <span className="font-medium tabular-nums">{formatARS(totalDebe)}</span>
              </span>
              <span>
                <span className="text-gray-500">Haber: </span>
                <span className="font-medium tabular-nums">{formatARS(totalHaber)}</span>
              </span>
            </div>
            {isBalanced ? (
              <span className="font-medium text-green-700">Balanceado ✓</span>
            ) : (
              <span className="font-medium text-red-700">
                Diferencia: {formatARS(Math.abs(diferencia))}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isBalanced || isPending}>
            Guardar asiento
          </Button>
        </div>
      </form>
    </Modal>
  )
}
