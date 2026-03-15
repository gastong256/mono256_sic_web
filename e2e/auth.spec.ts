import { expect, test } from '@playwright/test'
import { clearSession, loginAs, logout } from './support/session'

test.describe('Auth flow (baseline)', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('redirects unauthenticated users from protected routes to login', async ({ page }) => {
    await page.goto('/companies')

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcompanies/)
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible()
  })

  test('renders login form essentials', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('Usuario')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  test('allows login and shows main navigation', async ({ page }) => {
    await loginAs(page, 'admin')

    await expect(page.getByRole('button', { name: 'Empresas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Perfil' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  })

  test('logs out and blocks protected routes again', async ({ page }) => {
    await loginAs(page, 'admin')
    await logout(page)

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fprofile/)
  })
})
