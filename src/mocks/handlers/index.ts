import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { itemsHandlers } from '@/mocks/handlers/items.handlers'
import { companiesHandlers } from '@/mocks/handlers/companies.handlers'
import { accountsHandlers } from '@/mocks/handlers/accounts.handlers'

export const handlers = [
  ...authHandlers,
  ...itemsHandlers,
  ...companiesHandlers,
  ...accountsHandlers,
]
