import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { CompaniesPage } from '@/features/companies/pages/CompaniesPage'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { registerTokenProvider } from '@/shared/lib/http'
import { ToastProvider } from '@/shared/ui/ToastProvider'

function makeAccessToken(username: string) {
  const payload = btoa(JSON.stringify({ username }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `test.${payload}.token`
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function setAuthenticatedUser(role: 'admin' | 'teacher' | 'student' = 'admin') {
  act(() => {
    const username = role === 'teacher' ? 'teacher1' : role === 'student' ? 'student1' : 'admin'
    useAuthStore.setState({
      accessToken: makeAccessToken(username),
      refreshToken: 'mock-refresh-token',
      user: {
        id: role === 'teacher' ? 2 : role === 'student' ? 3 : 1,
        username,
        email: `${username}@example.com`,
        first_name: username,
        last_name: 'Test',
        is_staff: role !== 'student',
        role,
        course_id: role === 'student' ? 1 : null,
      },
    })
  })

  registerTokenProvider({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens: (access, refresh) => useAuthStore.getState().setTokens(access, refresh),
    logout: () => useAuthStore.getState().logout(),
  })
}

function renderCompaniesPage() {
  const queryClient = makeQueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CompaniesPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CompaniesPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('allows admins to publish and hide demo companies', async () => {
    const user = userEvent.setup()
    setAuthenticatedUser('admin')

    renderCompaniesPage()

    const demoRow = await screen.findByRole('row', { name: /empresa demo guiada/i })
    expect(within(demoRow).getByText(/slug demo: empresa-demo-guiada/i)).toBeInTheDocument()
    expect(within(demoRow).getByText('Oculta')).toBeInTheDocument()
    expect(within(demoRow).getByRole('button', { name: /publicar demo/i })).toBeInTheDocument()

    await user.click(within(demoRow).getByRole('button', { name: /publicar demo/i }))

    await waitFor(() => {
      const updatedRow = screen.getByRole('row', { name: /empresa demo guiada/i })
      expect(within(updatedRow).getByText('Publicada')).toBeInTheDocument()
      expect(within(updatedRow).getByRole('button', { name: /ocultar demo/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /ocultar demo/i }))

    await waitFor(() => {
      const updatedRow = screen.getByRole('row', { name: /empresa demo guiada/i })
      expect(within(updatedRow).getByText('Oculta')).toBeInTheDocument()
      expect(within(updatedRow).getByRole('button', { name: /publicar demo/i })).toBeInTheDocument()
    })
  })
})
