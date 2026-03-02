import { useQuery } from '@tanstack/react-query'
import { itemsApi } from '@/features/items/api/items.api'

export const ITEMS_QUERY_KEY = ['items'] as const

/**
 * Fetches and caches the items list.
 * Automatically refetches when the query key is invalidated
 * (e.g., after createItem succeeds via useCreateItem).
 */
export function useItems() {
  return useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: itemsApi.getItems,
  })
}
