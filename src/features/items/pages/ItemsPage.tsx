import { useItems } from '@/features/items/hooks/useItems'
import { ItemList } from '@/features/items/components/ItemList'
import { CreateItemForm } from '@/features/items/components/CreateItemForm'

export function ItemsPage() {
  const { data, isLoading, error } = useItems()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your items. Demonstrates TanStack Query + React Hook Form + Zod + MSW.
        </p>
      </div>

      {/* Create form */}
      <section aria-labelledby="create-section-title">
        <h2 id="create-section-title" className="mb-3 text-lg font-semibold text-gray-800">
          Create item
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <CreateItemForm />
        </div>
      </section>

      {/* Items list */}
      <section aria-labelledby="list-section-title">
        <div className="mb-3 flex items-center gap-3">
          <h2 id="list-section-title" className="text-lg font-semibold text-gray-800">
            All items
          </h2>
          {data?.total !== undefined && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
              {data.total}
            </span>
          )}
        </div>

        <ItemList items={data?.items ?? []} isLoading={isLoading} error={error} />
      </section>
    </div>
  )
}
