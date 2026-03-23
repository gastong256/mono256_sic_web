import { expect, test } from '@playwright/test'
import {
  clearSession,
  loginAs,
  openBooksMenu,
  openAsientosMenu,
  selectActiveCompany,
} from './support/session'

test.describe('Closing critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('previews and executes a closing, then blocks reversing generated entries', async ({
    page,
  }) => {
    const closingDate = new Date().toISOString().slice(0, 10)
    const reopeningDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')
    await openBooksMenu(page)
    await page.locator('a[href="/reports/closing"]:visible').first().click()

    await expect(page.getByRole('heading', { name: 'Balance General y Cierres' })).toBeVisible()
    await page.getByRole('button', { name: 'Preparar cierre' }).click()

    const dialog = page.getByRole('dialog', { name: /preparar cierre contable/i })
    await dialog.getByLabel('Fecha de cierre').fill(closingDate)
    await dialog.getByLabel('Fecha de reapertura').fill(reopeningDate)
    await dialog.getByRole('button', { name: 'Ver preview' }).click()

    await expect(page.getByRole('dialog', { name: /confirmar cierre contable/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/cierre de cuentas patrimoniales/i)).toBeVisible()
    await page.getByRole('button', { name: 'Ejecutar cierre' }).click()

    await expect(page.getByText(/cierre ejecutado correctamente/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /cierre confirmado/i })).toBeVisible()
    await expect(
      page.getByRole('alert').getByText(/documento contable de solo lectura/i)
    ).toBeVisible()
    await expect(page.getByText(closingDate)).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar Excel' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('cierre_contable')

    await openAsientosMenu(page)
    await page.locator('a[href="/journal"]:visible').first().click()
    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()

    const closingEntry = page.getByRole('button', {
      name: new RegExp(`${closingDate} Por cierre de Cuentas Patrimoniales`, 'i'),
    })
    await closingEntry.click()

    await expect(page.getByRole('button', { name: 'Reversar asiento' })).toBeDisabled()
  })
})
