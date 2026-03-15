import { expect, test } from '@playwright/test'
import { clearSession, loginAs, openBooksMenu, selectActiveCompany } from './support/session'

test.describe('Reports critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('renders the main reports with data for an active company', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await openBooksMenu(page)
    await page.getByRole('link', { name: 'Libro Diario' }).click()
    await expect(page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible()
    await expect(page.getByText(/Apertura/i)).toBeVisible()

    await openBooksMenu(page)
    await page.getByRole('link', { name: 'Libro Mayor' }).click()
    await expect(page.getByRole('heading', { name: 'Libro Mayor' })).toBeVisible()
    await expect(page.getByText(/1\.01\.01 · Caja en Pesos/i)).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Pago de sueldos' }).first()).toBeVisible()

    await openBooksMenu(page)
    await page.getByRole('link', { name: 'Balance de comprobacion' }).click()
    await expect(page.getByRole('heading', { name: 'Balance de Comprobacion' })).toBeVisible()
    await expect(page.getByText(/1\.01 · Caja y Bancos/i)).toBeVisible()
  })

  test('shows empty states for a company without accounting activity', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Librería del Centro')

    await openBooksMenu(page)
    await page.getByRole('link', { name: 'Libro Diario' }).click()
    await expect(page.getByText('Sin resultados en el periodo')).toBeVisible()

    await openBooksMenu(page)
    await page.getByRole('link', { name: 'Libro Mayor' }).click()
    await expect(page.getByText('Sin movimientos en el periodo consultado').first()).toBeVisible()
  })
})
