import { expect, type Page } from '@playwright/test'

type TestUserRole = 'admin' | 'teacher' | 'student'

const testUsers: Record<TestUserRole, { username: string; password: string }> = {
  admin: {
    username: 'admin',
    password: 'password',
  },
  teacher: {
    username: 'teacher1',
    password: 'password',
  },
  student: {
    username: 'student1',
    password: 'password',
  },
}

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`
}

export async function clearSession(page: Page) {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible()
}

export async function loginAs(page: Page, role: TestUserRole = 'admin') {
  const user = testUsers[role]

  await clearSession(page)

  await page.getByLabel('Usuario').fill(user.username)
  await page.getByLabel('Contraseña').fill(user.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  await expect(page).toHaveURL('/')
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL('/login')
}

export async function openBooksMenu(page: Page) {
  const button = page.getByRole('button', { name: 'Libros' })
  const link = page.getByRole('link', { name: 'Libro Diario' })

  await button.click()
  if (!(await link.isVisible())) {
    await button.click()
  }
  await expect(link).toBeVisible()
}

export async function openSupervisionMenu(page: Page) {
  const button = page.getByRole('button', { name: 'Supervision' })
  const link = page.getByRole('link', { name: 'Panel docente' })

  await button.click()
  if (!(await link.isVisible())) {
    await button.click()
  }
  await expect(link).toBeVisible()
}

export async function selectActiveCompany(page: Page, companyName: string) {
  const selector = page.locator('nav select').first()
  await expect(selector).toBeVisible()
  await selector.selectOption({ label: companyName })
  await expect(selector.locator('option:checked')).toContainText(companyName)
}
