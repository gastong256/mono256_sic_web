import { expect, type Locator, type Page } from '@playwright/test'

export async function openCompaniesPage(page: Page) {
  await page.getByRole('button', { name: 'Empresas' }).click()
  await expect(page).toHaveURL('/companies')
  await expect(page.getByRole('heading', { name: 'Empresas' })).toBeVisible()
}

export async function createCompany(
  page: Page,
  data: {
    name: string
    taxId?: string
  }
) {
  await openCompaniesPage(page)
  await page.getByRole('button', { name: 'Nueva empresa' }).click()

  const dialog = page.getByRole('dialog', { name: /nueva empresa/i })
  await dialog.getByLabel('Nombre').fill(data.name)
  if (data.taxId) {
    await dialog.getByLabel('CUIT').fill(data.taxId)
  }
  await dialog.getByRole('button', { name: 'Crear empresa' }).click()

  await expect(page.getByRole('cell', { name: data.name, exact: true })).toBeVisible()
}

export async function companyRow(page: Page, name: string): Promise<Locator> {
  const row = page.getByRole('row').filter({ hasText: name }).first()
  await expect(row).toBeVisible()
  return row
}
