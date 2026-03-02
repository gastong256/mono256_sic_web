import { useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '@/features/items/api/items.api'
import { ITEMS_QUERY_KEY } from '@/features/items/hooks/useItems'
import { logger } from '@/shared/lib/logger'

/**
 * Creates a new item and invalidates the items list cache so
 * the UI automatically refetches with the latest data.
 */
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: itemsApi.createItem,

    onSuccess: async (newItem) => {
      logger.info({ message: 'Item created', itemId: newItem.id, title: newItem.title })
      // Invalidate the items list so useItems re-fetches
      await queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    },

    onError: (error) => {
      logger.error({ message: 'Failed to create item', error: String(error) })
    },
  })
}
