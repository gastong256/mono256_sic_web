import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateItem } from '@/features/items/hooks/useCreateItem'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// ── Validation schema ─────────────────────────────────────────────────────────

const createItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or fewer'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
})

type CreateItemFormValues = z.infer<typeof createItemSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateItemForm() {
  const { mutate: createItem, isPending, error, isError } = useCreateItem()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateItemFormValues>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  function onSubmit(values: CreateItemFormValues) {
    createItem(
      {
        title: values.title,
        description: values.description,
      },
      {
        onSuccess: () => reset(),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create item form">
      {/* API-level error */}
      {isError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error instanceof Error ? error.message : 'Failed to create item. Please try again.'}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Title */}
        <div className="flex-1">
          <Input
            label="Title"
            placeholder="Enter item title"
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        {/* Description */}
        <div className="flex-1">
          <Input
            label="Description"
            placeholder="Optional description"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* Submit */}
        <div className="shrink-0">
          <Button type="submit" isLoading={isPending}>
            Add item
          </Button>
        </div>
      </div>
    </form>
  )
}
