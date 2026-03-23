import { expect, test, type Page } from '@playwright/test'
import {
  clearSession,
  loginAs,
  navigateFromVisibleLink,
  openBooksMenu,
  selectActiveCompany,
} from './support/session'

async function openReport(page: Page, href: string) {
  await openBooksMenu(page)
  await navigateFromVisibleLink(page, href)
}

test.describe('Reports critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('renders the main reports with data for an active company', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await openReport(page, '/reports/journal-book')
    await expect(page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible()
    await expect(page.getByText(/Cobranza de mostrador/i)).toBeVisible()
    await expect(page.getByText(/^Ejercicios$/i)).toBeVisible()
    await page.getByRole('button', { name: /Ejercicios/i }).click()
    await expect(page.getByRole('button', { name: /Ver cierre confirmado/i }).first()).toBeVisible()

    await openReport(page, '/reports/ledger')
    await expect(page.getByRole('heading', { name: 'Libro Mayor' })).toBeVisible()
    await expect(
      page
        .locator('article')
        .filter({ hasText: /1\.01\.01 · Caja en Pesos/i })
        .first()
    ).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Cobranza de mostrador' }).first()).toBeVisible()

    await openReport(page, '/reports/trial-balance')
    await expect(page.getByRole('heading', { name: 'Balance de Comprobacion' })).toBeVisible()
    await expect(page.getByText(/1\.01 · Caja y Bancos/i)).toBeVisible()
  })

  test('shows empty states for a company without accounting activity', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Consultora Delta')

    await openReport(page, '/reports/journal-book')
    await expect(page.getByText('Sin resultados en el periodo')).toBeVisible()

    await openReport(page, '/reports/ledger')
    await expect(page.getByText('Sin movimientos en el periodo consultado').first()).toBeVisible()
  })

  test('blocks accounting reports for a company pending opening', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Librería del Centro')

    await openReport(page, '/reports/journal-book')
    await expect(page.getByText(/Pendiente de apertura contable/i)).toBeVisible()
    await expect(
      page.getByText(/La empresa necesita registrarse con inventario inicial o general/i).first()
    ).toBeVisible()
  })

  test('shows confirmed closings and allows viewing and downloading the balance snapshot', async ({
    page,
  }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await openReport(page, '/reports/closing')
    await expect(page.getByRole('heading', { name: 'Balance General y Cierres' })).toBeVisible()
    await expect(page.getByText(/^Ejercicios$/i)).toBeVisible()

    await page.getByRole('button', { name: 'Ver cierre confirmado' }).first().click()
    await expect(page.getByRole('heading', { name: /cierre confirmado/i })).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar Excel' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('cierre_contable')
  })
})
