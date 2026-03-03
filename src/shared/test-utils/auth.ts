/**
 * Test utility: sets up a mock authenticated session.
 * Import in test files that need an Authorization header on HTTP calls.
 *
 * Usage:
 *   import { setupAuthForTests, teardownAuthForTests } from '@/shared/test-utils/auth'
 *   beforeEach(setupAuthForTests)
 *   afterEach(teardownAuthForTests)
 */

import { act } from '@testing-library/react'
import { registerTokenProvider } from '@/shared/lib/http'
import { useAuthStore } from '@/features/auth/store/auth.store'

export const TEST_USER = {
  id: 1,
  username: 'admin',
  email: 'user@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_staff: false,
}

export const TEST_ACCESS_TOKEN = 'mock-access-token'
export const TEST_REFRESH_TOKEN = 'mock-refresh-token'

export function setupAuthForTests(): void {
  act(() => {
    useAuthStore.setState({
      accessToken: TEST_ACCESS_TOKEN,
      refreshToken: TEST_REFRESH_TOKEN,
      user: TEST_USER,
    })
  })

  registerTokenProvider({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens: (access, refresh) => useAuthStore.getState().setTokens(access, refresh),
    logout: () => useAuthStore.getState().logout(),
  })
}

export function teardownAuthForTests(): void {
  act(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
    })
  })
  localStorage.clear()
}
