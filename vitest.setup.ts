import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/mocks/server'
import { resetMockDb } from '@/mocks/data/mockDb'
import { resetAccountsMock } from '@/mocks/handlers/accounts.handlers'

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockDb()
  resetAccountsMock()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
