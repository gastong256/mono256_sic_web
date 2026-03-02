import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useAuthStore } from '@/features/auth/store/auth.store'

// Reset store state before each test
beforeEach(() => {
  act(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
    })
  })

  // Clear persisted localStorage between tests
  localStorage.clear()
})

describe('auth store', () => {
  it('initializes with null tokens and user', () => {
    const { accessToken, refreshToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(user).toBeNull()
  })

  it('setTokens stores both tokens in state', () => {
    act(() => {
      useAuthStore.getState().setTokens('access-123', 'refresh-456')
    })

    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBe('access-123')
    expect(refreshToken).toBe('refresh-456')
  })

  it('setUser stores the user', () => {
    const mockUser = {
      id: '1',
      email: 'a@b.com',
      name: 'Alice',
      username: 'alice',
      is_staff: false,
    }

    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })

    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('logout clears accessToken, refreshToken, and user', () => {
    act(() => {
      useAuthStore.getState().setTokens('access-abc', 'refresh-xyz')
      useAuthStore
        .getState()
        .setUser({ id: '1', email: 'a@b.com', name: 'Alice', username: 'alice', is_staff: false })
    })

    act(() => {
      useAuthStore.getState().logout()
    })

    const { accessToken, refreshToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(user).toBeNull()
  })

  it('persists refreshToken to localStorage but NOT accessToken', () => {
    act(() => {
      useAuthStore.getState().setTokens('access-tok', 'refresh-tok')
    })

    const stored = JSON.parse(localStorage.getItem('auth-storage') ?? '{}') as {
      state?: { accessToken?: string; refreshToken?: string }
    }

    // refreshToken must be persisted
    expect(stored.state?.refreshToken).toBe('refresh-tok')
    // accessToken must NOT be persisted
    expect(stored.state?.accessToken).toBeUndefined()
  })
})
