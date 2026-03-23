import { expect, type Page } from '@playwright/test'

export async function createManualJournalEntry(
  page: Page,
  data: {
    description: string
    date?: string
    debitAccountLabel: string
    creditAccountLabel: string
    amount: string
  }
) {
  await page.getByRole('button', { name: '+ Nuevo asiento' }).click()

  const dialog = page.getByRole('dialog', { name: /nuevo asiento/i })
  if (data.date) {
    await dialog.locator('input[type="date"]').first().fill(data.date)
  }
  await dialog.getByPlaceholder('Concepto del asiento').fill(data.description)

  const accountSelects = dialog.locator('select')
  await accountSelects.nth(0).selectOption({ label: data.debitAccountLabel })
  await accountSelects.nth(1).selectOption({ label: data.creditAccountLabel })

  const amountInputs = dialog.locator('input[placeholder="0.00"]')
  await amountInputs.nth(0).fill(data.amount)
  await amountInputs.nth(3).fill(data.amount)

  await dialog.getByRole('button', { name: 'Guardar asiento' }).click()

  await expect(page.getByText('Asiento registrado correctamente.')).toBeVisible()
}
