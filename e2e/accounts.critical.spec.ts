import { expect, test } from '@playwright/test'
import { openCompaniesPage } from './support/companies'
import { clearSession, loginAs, uniqueName } from './support/session'

test.describe('Accounts critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('creates, edits and deletes a movement account from company detail', async ({ page }) => {
    const accountName = uniqueName('Caja E2E')
    const updatedAccountName = `${accountName} Actualizada`
    const suffix = String((Date.now() % 90) + 10).padStart(2, '0')
    const accountCode = `1.01.${suffix}`

    await loginAs(page, 'student')
    await openCompaniesPage(page)

    const companyRow = page.getByRole('row').filter({ hasText: 'Ferretería Los Andes' }).first()
    await expect(companyRow).toBeVisible()
    await companyRow.getByRole('button', { name: /ver /i }).click()
    await expect(page).toHaveURL('/companies/1')
    await expect(page.getByRole('heading', { name: 'Plan de cuentas' })).toBeVisible()

    await page.getByRole('button', { name: '+ Agregar cuenta' }).first().click()

    const createDialog = page.getByRole('dialog', { name: /nueva cuenta de movimiento/i })
    await createDialog.getByLabel('Nombre').fill(accountName)
    await createDialog.getByLabel('Código').fill(accountCode)
    await createDialog.getByRole('button', { name: 'Crear cuenta' }).click()

    await expect(page.getByText(accountName, { exact: true })).toBeVisible()

    await page.getByRole('button', { name: `Editar ${accountName}` }).click()

    const editDialog = page.getByRole('dialog', { name: /editar cuenta de movimiento/i })
    await editDialog.getByLabel('Nombre').fill(updatedAccountName)
    await editDialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByText(updatedAccountName, { exact: true })).toBeVisible()

    await page.getByRole('button', { name: `Eliminar ${updatedAccountName}` }).click()

    const deleteDialog = page.getByRole('dialog', { name: /eliminar cuenta/i })
    await deleteDialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(deleteDialog).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: `Editar ${updatedAccountName}` })
    ).not.toBeVisible()
  })
})
