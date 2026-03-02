import { httpClient } from '@/shared/lib/http'
import type { Item, ItemsResponse, CreateItemPayload } from '@/features/items/types/item.types'

/**
 * Items API — all calls go through the shared httpClient.
 * Authorization header and X-Request-ID are attached automatically
 * by the request interceptor in shared/lib/http.ts.
 *
 * Backend contract (FastAPI/Django example):
 *   GET  /items        → { items: Item[], total: number }
 *   POST /items        → Item (201)
 */
export const itemsApi = {
  /**
   * GET /items
   * Returns the full list of items for the authenticated user.
   */
  getItems: (): Promise<ItemsResponse> =>
    httpClient.get<ItemsResponse>('/items').then((r) => r.data),

  /**
   * POST /items
   * Creates a new item. Returns the created item.
   */
  createItem: (payload: CreateItemPayload): Promise<Item> =>
    httpClient.post<Item>('/items', payload).then((r) => r.data),
}
