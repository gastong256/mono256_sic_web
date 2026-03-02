import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { itemsHandlers } from '@/mocks/handlers/items.handlers'

export const handlers = [...authHandlers, ...itemsHandlers]
