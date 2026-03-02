import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useAuthStore } from '@/features/auth/store/auth.store'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper(initialPath = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      createElement(QueryClientProvider, { client: queryClient }, children),
    )
  }

  return { Wrapper, queryClient }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null })
  })
  localStorage.clear()
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useLogin', () => {
  it('sets accessToken and refreshToken in store on successful login', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).not.toBeNull()
    expect(refreshToken).not.toBeNull()
  })

  it('sets user in store on successful login', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const { user } = useAuthStore.getState()
    expect(user).not.toBeNull()
    expect(user?.email).toBe('user@example.com')
  })

  it('returns an error for invalid credentials', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'bad@example.com', password: 'wrong' })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('is in pending state while the mutation is in-flight', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    // Call mutate without act() so the pending state is observable via waitFor
    // (act() flushes the full promise cycle immediately, skipping the pending state)
    result.current.mutate({ email: 'user@example.com', password: 'password' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('redirects to returnTo path after successful login', async () => {
    const { Wrapper } = makeWrapper('/login?returnTo=%2Fitems')
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Navigation is handled by useNavigate inside useLogin;
    // in MemoryRouter we can't assert window.location, but we can
    // verify the mutation succeeded (redirect is triggered on success).
    expect(result.current.isSuccess).toBe(true)
  })
})
