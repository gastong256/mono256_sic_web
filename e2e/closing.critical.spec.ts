import { expect, test } from '@playwright/test'
import { companyRow, openCompaniesPage } from './support/companies'
import { clearSession, loginAs, selectActiveCompany } from './support/session'

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
    await openCompaniesPage(page)

    const row = await companyRow(page, 'Ferretería Los Andes')
    await row.getByRole('button', { name: /ver ferretería los andes/i }).click()

    await expect(page.getByRole('heading', { name: 'Plan de cuentas' })).toBeVisible()
    await page.getByRole('button', { name: 'Preparar cierre' }).click()

    const dialog = page.getByRole('dialog', { name: /preparar cierre contable/i })
    await dialog.getByLabel('Fecha de cierre').fill(closingDate)
    await dialog.getByLabel('Fecha de reapertura').fill(reopeningDate)
    await dialog.getByRole('button', { name: 'Ver preview' }).click()

    await expect(page.getByRole('dialog', { name: /confirmar cierre contable/i })).toBeVisible()
    await expect(page.getByText(/cierre de cuentas patrimoniales/i)).toBeVisible()
    await page.getByRole('button', { name: 'Ejecutar cierre' }).click()

    await expect(page.getByText(/cierre ejecutado correctamente/i)).toBeVisible()
    await expect(page.getByText(/libros están cerrados hasta/i)).toContainText(closingDate)

    await selectActiveCompany(page, 'Ferretería Los Andes')
    await page.getByRole('button', { name: 'Asientos' }).click()
    await page.getByRole('link', { name: 'Registro manual' }).click()
    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()

    const closingEntry = page.getByRole('button', {
      name: new RegExp(`${closingDate} Por cierre de Cuentas Patrimoniales`, 'i'),
    })
    await closingEntry.click()

    await expect(page.getByRole('button', { name: 'Reversar asiento' })).toBeDisabled()
  })
})
