import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { companiesHandlers } from '@/mocks/handlers/companies.handlers'
import { accountsHandlers } from '@/mocks/handlers/accounts.handlers'
import { journalHandlers } from '@/mocks/handlers/journal.handlers'
import { teacherHandlers } from '@/mocks/handlers/teacher.handlers'
import { chartConfigHandlers } from '@/mocks/handlers/chartConfig.handlers'
import { adminHandlers } from '@/mocks/handlers/admin.handlers'
import { reportsHandlers } from '@/mocks/handlers/reports.handlers'

export const handlers = [
  ...authHandlers,
  ...companiesHandlers,
  ...accountsHandlers,
  ...journalHandlers,
  ...reportsHandlers,
  ...teacherHandlers,
  ...chartConfigHandlers,
  ...adminHandlers,
]
