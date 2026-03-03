import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { companiesHandlers } from '@/mocks/handlers/companies.handlers'
import { accountsHandlers } from '@/mocks/handlers/accounts.handlers'
import { journalHandlers } from '@/mocks/handlers/journal.handlers'

export const handlers = [
  ...authHandlers,
  ...companiesHandlers,
  ...accountsHandlers,
  ...journalHandlers,
]
