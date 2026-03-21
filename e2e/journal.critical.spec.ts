import { expect, test } from '@playwright/test'
import { clearSession, loginAs, openAsientosMenu, selectActiveCompany } from './support/session'

test.describe('Journal critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('expands a manual entry detail and reverses it in the active company', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')
    await openAsientosMenu(page)
    await page.locator('a[href="/journal"]:visible').first().click()

    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()

    const entry = page.getByRole('button', { name: /2026-01-15 Cobranza de mostrador/i })
    await entry.click()

    await expect(page.getByText('4.01.01 - Ventas al Contado')).toBeVisible()
    await expect(page.getByText('1.01.01 - Caja en Pesos')).toBeVisible()

    await page.getByRole('button', { name: 'Reversar asiento' }).click()

    const confirmDialog = page.getByRole('dialog', { name: /reversar asiento/i })
    await confirmDialog.getByRole('button', { name: 'Reversar' }).click()

    await expect(page.getByText('Asiento reversado correctamente.')).toBeVisible()
    await expect(page.getByText(/Reversa: Cobranza de mostrador/i)).toBeVisible()
  })

  test('blocks journal operations when the company is pending opening', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Librería del Centro')
    await openAsientosMenu(page)
    await page.locator('a[href="/journal"]:visible').first().click()

    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()
    await expect(page.getByText(/Pendiente de apertura contable/i)).toBeVisible()
    await expect(
      page.getByRole('alert').filter({
        hasText: /La empresa necesita registrarse con inventario inicial o general/i,
      })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ nuevo asiento/i })).toBeDisabled()
  })
})
