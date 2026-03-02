import { ItemCard } from '@/features/items/components/ItemCard'
import type { Item } from '@/features/items/types/item.types'
import { Spinner } from '@/shared/ui/Spinner'

interface ItemListProps {
  items: Item[]
  isLoading: boolean
  error: Error | null
}

export function ItemList({ items, isLoading, error }: ItemListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-blue-600" label="Loading items…" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <strong>Failed to load items:</strong> {error.message}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">No items yet.</p>
        <p className="mt-1 text-xs text-gray-400">Create your first item using the form above.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3" aria-label="Items list">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}
