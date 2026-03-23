import { expect, test } from '@playwright/test'
import { companyRow, createCompany, openCompaniesPage } from './support/companies'
import { clearSession, loginAs, uniqueName } from './support/session'

test.describe('Companies critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('creates, edits and deletes a company', async ({ page }) => {
    const companyName = uniqueName('Empresa Critica')
    const updatedName = `${companyName} Editada`

    await loginAs(page, 'admin')
    await createCompany(page, { name: companyName, taxId: '30-12345678-9' })

    const createdRow = await companyRow(page, companyName)
    await createdRow.getByRole('button', { name: `Editar ${companyName}` }).click()

    const editDialog = page.getByRole('dialog', { name: /editar empresa/i })
    await editDialog.getByLabel('Nombre').fill(updatedName)
    await editDialog.getByLabel('CUIT').fill('30-87654321-0')
    await editDialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByRole('cell', { name: updatedName, exact: true })).toBeVisible()
    await expect(page.getByText('Empresa actualizada correctamente.')).toBeVisible()

    const updatedRow = await companyRow(page, updatedName)
    await updatedRow.getByRole('button', { name: `Eliminar ${updatedName}` }).click()

    const deleteDialog = page.getByRole('dialog', { name: /eliminar empresa/i })
    await deleteDialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(page.getByText('Empresa eliminada.')).toBeVisible()
    await expect(page.getByRole('cell', { name: updatedName, exact: true })).not.toBeVisible()

    await openCompaniesPage(page)
    await expect(page.getByRole('cell', { name: updatedName, exact: true })).not.toBeVisible()
  })

  test('admin can publish and hide a demo company', async ({ page }) => {
    await loginAs(page, 'admin')
    await openCompaniesPage(page)

    const demoRow = await companyRow(page, 'Empresa Demo Guiada')
    await expect(demoRow.getByText('Oculta')).toBeVisible()
    await expect(demoRow.getByText(/slug de demo: empresa-demo-guiada/i)).toBeVisible()

    await demoRow.getByRole('button', { name: 'Publicar demo' }).click()
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: 'Empresa Demo Guiada' })
        .first()
        .getByText('Publicada')
    ).toBeVisible({ timeout: 15_000 })
    await expect(demoRow.getByRole('button', { name: 'Ocultar demo' })).toBeVisible({
      timeout: 15_000,
    })

    await demoRow.getByRole('button', { name: 'Ocultar demo' }).click()
    await expect(
      page.getByRole('row').filter({ hasText: 'Empresa Demo Guiada' }).first().getByText('Oculta')
    ).toBeVisible({ timeout: 15_000 })
    await expect(demoRow.getByRole('button', { name: 'Publicar demo' })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('students can see published read-only demo companies in visible listings', async ({
    page,
  }) => {
    await loginAs(page, 'student')
    await openCompaniesPage(page)

    const demoRow = await companyRow(page, 'Demo Comercial Publicada')
    await expect(demoRow.getByText('Publicada', { exact: true })).toBeVisible()
    await expect(demoRow.getByText('Solo lectura')).toBeVisible()
  })
})
