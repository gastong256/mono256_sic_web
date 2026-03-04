import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const DEMO_USER = {
  username: 'admin',
  password: 'password',
}

async function login(page: Page) {
  await page.goto('/login')

  await page.getByLabel('Usuario').fill(DEMO_USER.username)
  await page.getByLabel('Contraseña').fill(DEMO_USER.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  await expect(page).toHaveURL('/')
}

test.describe('Auth flow (baseline)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
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
    await login(page)

    await expect(page.getByRole('button', { name: 'Empresas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Perfil' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  })

  test('logs out and blocks protected routes again', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fprofile/)
  })
})
