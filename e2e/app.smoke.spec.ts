import { expect, test } from '@playwright/test'
import { clearSession, loginAs, openBooksMenu } from './support/session'
import { createCompany } from './support/companies'

test.describe('App baseline smoke', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('registers a new student from public register page', async ({ page }) => {
    const uniqueUsername = `e2e_student_${Date.now()}`

    await page.goto('/register')

    await page.getByLabel('Usuario').fill(uniqueUsername)
    await page.getByLabel('Contraseña', { exact: true }).fill('password123')
    await page.getByLabel('Confirmar contraseña').fill('password123')
    await page.getByLabel('Código de registro').fill('SIC-2026')
    await page.getByRole('button', { name: 'Registrarme' }).click()

    await expect(page.getByText('Usuario creado correctamente.')).toBeVisible()
  })

  test('creates a company and renders it in companies table', async ({ page }) => {
    await loginAs(page, 'admin')
    await createCompany(page, { name: `Empresa E2E ${Date.now()}` })
  })

  test('navigates reports pages from libros menu', async ({ page }) => {
    await loginAs(page, 'admin')

    await openBooksMenu(page)
    await expect(page.getByRole('link', { name: 'Libro Diario' })).toBeVisible()
    await page.getByRole('link', { name: 'Libro Diario' }).click()
    await expect(page).toHaveURL('/reports/journal-book')
    await expect(page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible()

    await openBooksMenu(page)
    await expect(page.getByRole('link', { name: 'Libro Mayor' })).toBeVisible()
    await page.getByRole('link', { name: 'Libro Mayor' }).click()
    await expect(page).toHaveURL('/reports/ledger')
    await expect(page.getByRole('heading', { name: 'Libro Mayor' })).toBeVisible()

    await openBooksMenu(page)
    await expect(page.getByRole('link', { name: 'Balance de comprobacion' })).toBeVisible()
    await page.getByRole('link', { name: 'Balance de comprobacion' }).click()
    await expect(page).toHaveURL('/reports/trial-balance')
    await expect(page.getByRole('heading', { name: 'Balance de Comprobacion' })).toBeVisible()
  })
})
