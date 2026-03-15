import { expect, test } from '@playwright/test'
import { clearSession, loginAs, selectActiveCompany } from './support/session'

test.describe('Journal critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('expands an entry detail and reverses it in the active company', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()

    const openingEntry = page.getByRole('button', { name: /2024-03-01 Apertura/i })
    await openingEntry.click()

    await expect(page.getByText('1.01.01 - Caja en Pesos')).toBeVisible()
    await expect(page.getByText('1.01.02 - Banco Nación Cta. Cte.')).toBeVisible()

    await page.getByRole('button', { name: 'Reversar asiento' }).click()

    const confirmDialog = page.getByRole('dialog', { name: /reversar asiento/i })
    await confirmDialog.getByRole('button', { name: 'Reversar' }).click()

    await expect(page.getByText('Asiento reversado correctamente.')).toBeVisible()
    await expect(page.getByText(/Reversa: Apertura/i)).toBeVisible()
  })
})
