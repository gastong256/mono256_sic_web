import { expect, test } from '@playwright/test'
import { companyRow, createCompanyWithOpening } from './support/companies'
import { createManualJournalEntry } from './support/journal'
import {
  clearSession,
  loginAs,
  navigateFromVisibleLink,
  openAsientosMenu,
  openBooksMenu,
  selectActiveCompany,
  uniqueName,
} from './support/session'

test.describe('Opening and books critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('creates a company with opening and leaves it ready for journal and books', async ({
    page,
  }) => {
    const companyName = uniqueName('Empresa Apertura')
    const sourceRef = `AP-${Date.now()}`

    await loginAs(page, 'student')
    await createCompanyWithOpening(page, {
      name: companyName,
      taxId: '30-55555555-5',
      assetName: 'Caja Inicial E2E',
      assetAmount: '1500.00',
      sourceRef,
    })

    const row = await companyRow(page, companyName)
    await expect(row.getByText('Pendiente de apertura')).not.toBeVisible()

    await navigateFromVisibleLink(page, '/', '/')
    await selectActiveCompany(page, companyName)
    await openAsientosMenu(page)
    await navigateFromVisibleLink(page, '/journal', /\/journal/)

    await expect(page.getByRole('heading', { name: 'Asientos' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Nuevo asiento' })).toBeEnabled()
    await expect(page.getByText(sourceRef)).toBeVisible()

    await openBooksMenu(page)
    await navigateFromVisibleLink(page, '/reports/journal-book', /\/reports\/journal-book/)
    await expect(page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible()
    await expect(page.getByText(sourceRef)).toBeVisible()
  })

  test('registers a manual entry and allows downloading diario, mayor and balance', async ({
    page,
  }) => {
    const description = uniqueName('Asiento Manual E2E')

    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')
    await openAsientosMenu(page)
    await navigateFromVisibleLink(page, '/journal', /\/journal/)

    await createManualJournalEntry(page, {
      description,
      debitAccountLabel: '1.01.01 - Caja en Pesos',
      creditAccountLabel: '4.01.01 - Ventas al Contado',
      amount: '1234.56',
    })

    await expect(page.getByText(description)).toBeVisible()

    await navigateFromVisibleLink(page, '/', '/')
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
    await expect(page.getByText(description)).toBeVisible()

    await openBooksMenu(page)
    await navigateFromVisibleLink(page, '/reports/journal-book', /\/reports\/journal-book/)
    await expect(page.getByText(description)).toBeVisible()
    {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Descargar Excel' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('libro-diario')
    }

    await openBooksMenu(page)
    await navigateFromVisibleLink(page, '/reports/ledger', /\/reports\/ledger/)
    await expect(page.getByRole('heading', { name: 'Libro Mayor' })).toBeVisible()
    await expect(page.getByText(description).first()).toBeVisible()
    {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Descargar Excel' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('libro-mayor')
    }

    await openBooksMenu(page)
    await navigateFromVisibleLink(page, '/reports/trial-balance', /\/reports\/trial-balance/)
    await expect(page.getByRole('heading', { name: 'Balance de Comprobacion' })).toBeVisible()
    {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Descargar Excel' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('balance-comprobacion')
    }
  })
})
