import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ManualPage } from '@/features/manual/components/ManualPage'
import type { Role, User } from '@/shared/types'

function buildUser(role: Role): User {
  return {
    id: 1,
    username: `${role}_user`,
    email: `${role}@local.test`,
    first_name: role,
    last_name: 'test',
    is_staff: role === 'admin',
    role,
  }
}

async function renderManualPage(role: Role, initialEntries = ['/manual']) {
  useAuthStore.setState({
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    user: buildUser(role),
  })

  let result
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={initialEntries}>
        <ManualPage />
      </MemoryRouter>
    )
    await Promise.resolve()
  })

  return result
}

afterEach(() => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
  })
})

describe('ManualPage', () => {
  it('limits students to student-relevant guides and hides teacher-only flows', async () => {
    const user = userEvent.setup()

    await renderManualPage('student')
    await screen.findByRole('heading', { name: 'Crear empresa y registrar asiento de apertura' })

    expect(screen.queryByRole('button', { name: 'Docente' })).not.toBeInTheDocument()
    expect(screen.getByText('Configurar plan de cuentas de mi empresa')).toBeInTheDocument()
    expect(screen.queryByText('Crear curso, enrolar y supervisar alumnos')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar flujo o paso'), 'curso')
    expect(screen.getByText('No encontramos flujos para ese criterio')).toBeInTheDocument()
  })

  it('lets teachers browse teacher flows and shared operational guides', async () => {
    const user = userEvent.setup()

    await renderManualPage('teacher')
    await screen.findByRole('heading', { name: 'Crear empresa y registrar asiento de apertura' })

    expect(screen.getByRole('button', { name: 'Docente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alumno' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Docente' }))

    expect(screen.getByText('Crear curso, enrolar y supervisar alumnos')).toBeInTheDocument()
    expect(
      screen.getByText('Definir visibilidad del plan de cuentas, demos y empresas compartidas')
    ).toBeInTheDocument()
    expect(screen.queryByText('No encontramos flujos para ese criterio')).not.toBeInTheDocument()
  })

  it('falls back to an allowed flow when a student opens a teacher-only flow by query string', async () => {
    await renderManualPage('student', ['/manual?flow=gestionar-curso-alumnos'])
    await screen.findByRole('heading', { name: 'Crear empresa y registrar asiento de apertura' })

    expect(
      screen.queryByRole('heading', { name: 'Crear curso, enrolar y supervisar alumnos' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Crear empresa y registrar asiento de apertura' })
    ).toBeInTheDocument()
  })
})
