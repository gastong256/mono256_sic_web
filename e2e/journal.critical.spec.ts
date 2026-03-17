import { expect, test } from '@playwright/test'
import { clearSession, loginAs, selectActiveCompany } from './support/session'

test.describe('Journal critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('expands a manual entry detail and reverses it in the active company', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()

    const entry = page.getByRole('button', { name: /2024-03-15 Pago de sueldos/i })
    await entry.click()

    await expect(page.getByText('5.02.01 - Sueldos y Jornales')).toBeVisible()
    await expect(page.getByText('1.01.01 - Caja en Pesos')).toBeVisible()

    await page.getByRole('button', { name: 'Reversar asiento' }).click()

    const confirmDialog = page.getByRole('dialog', { name: /reversar asiento/i })
    await confirmDialog.getByRole('button', { name: 'Reversar' }).click()

    await expect(page.getByText('Asiento reversado correctamente.')).toBeVisible()
    await expect(page.getByText(/Reversa: Pago de sueldos/i)).toBeVisible()
  })

  test('blocks journal operations when the company is pending opening', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Librería del Centro')

    await expect(page.getByText(/Pendiente de apertura contable/i)).toBeVisible()
    await expect(
      page.getByRole('alert').filter({
        hasText: /La empresa necesita registrarse con inventario inicial o general/i,
      })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ nuevo asiento/i })).toBeDisabled()
  })
})
