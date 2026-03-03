import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { act } from '@testing-library/react'
import { RequireRole } from '@/features/auth/components/RequireRole'
import { useAuthStore } from '@/features/auth/store/auth.store'

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<RequireRole roles={['teacher', 'admin']} />}>
          <Route path="/teacher/dashboard" element={<div>Teacher Dashboard</div>} />
        </Route>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireRole', () => {
  it('redirects unauthenticated user to login', async () => {
    act(() => {
      useAuthStore.setState({ accessToken: null, refreshToken: null, user: null })
    })

    renderWithRoute('/teacher/dashboard')
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('redirects authenticated student to home', async () => {
    act(() => {
      useAuthStore.setState({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: 1,
          username: 'student1',
          email: 's1@example.com',
          first_name: 'S1',
          last_name: 'L1',
          is_staff: false,
          role: 'student',
        },
      })
    })

    renderWithRoute('/teacher/dashboard')
    expect(await screen.findByText('Home')).toBeInTheDocument()
  })

  it('allows teacher to access protected route', async () => {
    act(() => {
      useAuthStore.setState({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: 2,
          username: 'teacher1',
          email: 't1@example.com',
          first_name: 'T1',
          last_name: 'L1',
          is_staff: true,
          role: 'teacher',
        },
      })
    })

    renderWithRoute('/teacher/dashboard')
    expect(await screen.findByText('Teacher Dashboard')).toBeInTheDocument()
  })
})
