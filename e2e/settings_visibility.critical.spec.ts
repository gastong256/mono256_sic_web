import { expect, test } from '@playwright/test'
import { clearSession, loginAs, openSupervisionMenu } from './support/session'

test.describe('Settings visibility critical flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('teacher can update chart visibility and the student sees the filtered tree', async ({
    page,
  }) => {
    await loginAs(page, 'teacher')
    await openSupervisionMenu(page)
    const settingsLink = page.getByRole('link', { name: 'Plan de cuentas' })
    await expect(settingsLink).toBeVisible()
    await Promise.all([page.waitForURL('/settings/chart-visibility'), settingsLink.click()])

    await expect(
      page.getByRole('heading', { name: 'Visibilidad del plan de cuentas' })
    ).toBeVisible()

    const accountRow = page.locator('li', { hasText: '5.03' }).first()
    await expect(accountRow).toBeVisible()

    const checkbox = accountRow.getByRole('checkbox')
    await expect(checkbox).toBeChecked()
    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/accounts/visibility/batch/') &&
        response.request().method() === 'PATCH'
    )
    await checkbox.uncheck()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await saveResponsePromise
    await expect(checkbox).not.toBeChecked()

    await loginAs(page, 'student')
    await page.getByRole('button', { name: 'Empresas' }).click()
    const studentCompanyButton = page.getByRole('button', {
      name: 'Ferretería Los Andes',
      exact: true,
    })
    await expect(studentCompanyButton).toBeVisible()
    await studentCompanyButton.click()
    await expect(page).toHaveURL(/\/companies\/\d+$/)
    await expect(page.getByRole('heading', { name: 'Plan de cuentas' })).toBeVisible()
    await expect(page.getByText('Gastos Financieros')).not.toBeVisible()

    await loginAs(page, 'teacher')
    await openSupervisionMenu(page)
    const restoreSettingsLink = page.getByRole('link', { name: 'Plan de cuentas' })
    await expect(restoreSettingsLink).toBeVisible()
    await Promise.all([page.waitForURL('/settings/chart-visibility'), restoreSettingsLink.click()])
    const restoredRow = page.locator('li', { hasText: '5.03' }).first()
    const restoreResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/accounts/visibility/batch/') &&
        response.request().method() === 'PATCH'
    )
    await restoredRow.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await restoreResponsePromise
    await expect(restoredRow.getByRole('checkbox')).toBeChecked()
  })
})
