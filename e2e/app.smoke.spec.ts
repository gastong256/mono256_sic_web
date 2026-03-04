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

test.describe('App baseline smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
  })

  test('registers a new student from public register page', async ({ page }) => {
    const uniqueUsername = `e2e_student_${Date.now()}`

    await page.goto('/register')

    await page.getByLabel('Usuario').fill(uniqueUsername)
    await page.getByLabel('Contraseña').fill('password123')
    await page.getByLabel('Confirmar contraseña').fill('password123')
    await page.getByLabel('Código de registro').fill('SIC-2026')
    await page.getByRole('button', { name: 'Registrarme' }).click()

    await expect(page.getByText('Usuario creado correctamente.')).toBeVisible()
  })

  test('creates a company and renders it in companies table', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Empresas' }).click()
    await expect(page).toHaveURL('/companies')

    const companyName = `Empresa E2E ${Date.now()}`

    await page.getByRole('button', { name: 'Nueva empresa' }).click()
    await page.getByRole('dialog').getByLabel('Nombre').fill(companyName)
    await page.getByRole('button', { name: 'Crear empresa' }).click()

    await expect(page.getByText(companyName)).toBeVisible()
  })

  test('navigates reports pages from libros menu', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: 'Libros' }).click()
    await page.getByRole('link', { name: 'Libro Diario' }).click()
    await expect(page).toHaveURL('/reports/journal-book')
    await expect(page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible()

    await page.getByRole('button', { name: 'Libros' }).click()
    await page.getByRole('link', { name: 'Libro Mayor' }).click()
    await expect(page).toHaveURL('/reports/ledger')
    await expect(page.getByRole('heading', { name: 'Libro Mayor' })).toBeVisible()

    await page.getByRole('button', { name: 'Libros' }).click()
    await page.getByRole('link', { name: 'Balance de comprobacion' }).click()
    await expect(page).toHaveURL('/reports/trial-balance')
    await expect(page.getByRole('heading', { name: 'Balance de Comprobacion' })).toBeVisible()
  })
})
