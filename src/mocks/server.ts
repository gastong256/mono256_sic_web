import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

/**
 * MSW Node server for unit/integration tests (Vitest).
 * Started/stopped by vitest.setup.ts via beforeAll/afterAll.
 */
export const server = setupServer(...handlers)
