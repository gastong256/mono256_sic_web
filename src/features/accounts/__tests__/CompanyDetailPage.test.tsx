import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { CompanyDetailPage } from '@/features/accounts/pages/CompanyDetailPage'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { registerTokenProvider } from '@/shared/lib/http'
import { env } from '@/shared/config/env'
import { server } from '@/mocks/server'
import { resetAccountsMock } from '@/mocks/handlers/accounts.handlers'

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

function setAuthenticatedUser(
  role: 'admin' | 'teacher' | 'student' = 'student',
  overrides?: Partial<ReturnType<typeof useAuthStore.getState>['user']>
) {
  act(() => {
    const username = role === 'teacher' ? 'teacher1' : role === 'admin' ? 'admin' : 'student1'
    useAuthStore.setState({
      accessToken: makeAccessToken(username),
      refreshToken: 'mock-refresh-token',
      user: {
        id: role === 'teacher' ? 2 : 3,
        username,
        email: `${role}@example.com`,
        first_name: role === 'teacher' ? 'Tomas' : role === 'admin' ? 'Ada' : 'Sofia',
        last_name: role === 'teacher' ? 'Teacher' : role === 'admin' ? 'Admin' : 'Student',
        is_staff: role !== 'student',
        role,
        course_id: role === 'student' ? 1 : null,
        ...(overrides ?? {}),
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

function renderCompanyDetailPage() {
  const queryClient = makeQueryClient()
  return render(
    <MemoryRouter initialEntries={['/companies/1']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CompanyDetailPage', () => {
  beforeEach(() => {
    resetAccountsMock()
    localStorage.clear()
  })

  it('renders the backend-filtered account tree for students without requesting visibility', async () => {
    setAuthenticatedUser('student')
    server.use(
      http.get(`${env.VITE_API_BASE_URL}/accounts/company/1/`, () =>
        HttpResponse.json([
          {
            id: 5,
            code: '5',
            name: 'Egresos',
            type: 'EX',
            level: 0,
            is_leaf: false,
            children: [
              {
                id: 52,
                code: '5.02',
                name: 'Gastos Operativos',
                type: 'EX',
                level: 1,
                is_leaf: false,
                children: [
                  {
                    id: 303,
                    code: '5.02.01',
                    name: 'Sueldos y Jornales',
                    type: 'EX',
                    level: 2,
                    is_leaf: true,
                    children: [],
                  },
                ],
              },
            ],
          },
        ])
      )
    )

    renderCompanyDetailPage()

    expect(await screen.findByText('Gastos Operativos')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Activo')).not.toBeInTheDocument()
      expect(screen.queryByText('Caja y Bancos')).not.toBeInTheDocument()
      expect(screen.queryByText('Caja en Pesos')).not.toBeInTheDocument()
    })
  })

  it('creates a movement account under a collective account', async () => {
    const user = userEvent.setup()
    setAuthenticatedUser('admin')

    renderCompanyDetailPage()

    await screen.findByText('Caja y Bancos')
    await user.click(screen.getAllByRole('button', { name: /\+ agregar cuenta/i })[0])
    await user.type(screen.getByLabelText(/^nombre$/i), 'Caja secundaria')
    await user.type(screen.getByLabelText(/^código$/i), '1.01.03')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('Caja secundaria')).toBeInTheDocument()
  })

  it('edits an existing movement account', async () => {
    const user = userEvent.setup()
    setAuthenticatedUser('admin')

    renderCompanyDetailPage()

    await screen.findByText('Caja en Pesos')
    await user.click(screen.getByRole('button', { name: /editar caja en pesos/i }))
    const nameInput = screen.getByLabelText(/^nombre$/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Caja principal actualizada')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('Caja principal actualizada')).toBeInTheDocument()
  })

  it('deletes a movement account successfully', async () => {
    const user = userEvent.setup()
    setAuthenticatedUser('admin')

    renderCompanyDetailPage()

    await screen.findByText('Banco Nación Cta. Cte.')
    await user.click(screen.getByRole('button', { name: /eliminar banco nación cta. cte./i }))
    await user.click(screen.getByRole('button', { name: /^eliminar$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Banco Nación Cta. Cte.')).not.toBeInTheDocument()
    })
  })
})
