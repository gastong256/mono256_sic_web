import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { TeacherDashboardPage } from '@/features/teacher/pages/TeacherDashboardPage'
import { ToastProvider } from '@/shared/ui/ToastProvider'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { registerTokenProvider } from '@/shared/lib/http'

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

function setupTeacherAuth() {
  act(() => {
    useAuthStore.setState({
      accessToken: makeAccessToken('teacher1'),
      refreshToken: 'mock-refresh-token',
      user: {
        id: 2,
        username: 'teacher1',
        email: 'teacher1@example.com',
        first_name: 'Tomas',
        last_name: 'Teacher',
        is_staff: true,
        role: 'teacher',
        course_id: null,
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

function renderTeacherDashboardPage() {
  const queryClient = makeQueryClient()
  return render(
    <MemoryRouter initialEntries={['/teacher/dashboard']}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TeacherDashboardPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('TeacherDashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setupTeacherAuth()
  })

  it('renders course blocks using composed course summary and journal queries', async () => {
    renderTeacherDashboardPage()

    expect(await screen.findByText('Contabilidad I')).toBeInTheDocument()
    expect(await screen.findByText(/sofía student/i)).toBeInTheDocument()
    expect(await screen.findByText(/4 empresa\(s\) · 2 asiento\(s\)/i)).toBeInTheDocument()
    expect(await screen.findByText(/pedro student/i)).toBeInTheDocument()
    expect(await screen.findByText(/5 empresa\(s\) · 3 asiento\(s\)/i)).toBeInTheDocument()
  })
})
