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
  await page.context().clearCookies()
  await page.reload()
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible()
  await expect(page.getByRole('form', { name: /inicio de sesión/i })).toBeVisible()
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
  const mobileMenuButton = page.getByRole('button', { name: /toggle navigation menu|menu/i })
  if (await mobileMenuButton.isVisible().catch(() => false)) {
    const diaryLink = page.getByRole('link', { name: 'Libro Diario' })
    if (!(await diaryLink.isVisible().catch(() => false))) {
      await mobileMenuButton.click()
    }
  }

  const button = page.getByRole('button', { name: /^Libros$/ })
  const link = page.getByRole('link', { name: 'Libro Diario' })

  if (await button.isVisible().catch(() => false)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await button.click()
      await page.waitForTimeout(120)
      if (await link.isVisible().catch(() => false)) {
        break
      }
    }
  }

  await expect(link).toBeVisible()
}

export async function navigateFromVisibleLink(
  page: Page,
  href: string,
  expectedUrl: string | RegExp = href
) {
  const link = page.locator(`a[href="${href}"]:visible`).first()
  await expect(link).toBeVisible()
  await Promise.all([page.waitForURL(expectedUrl), link.dispatchEvent('click')])
}

export async function openAsientosMenu(page: Page) {
  const mobileMenuButton = page.getByRole('button', { name: /toggle navigation menu|menu/i })
  if (await mobileMenuButton.isVisible().catch(() => false)) {
    const entryLink = page.getByRole('link', { name: 'Registro manual' })
    if (!(await entryLink.isVisible().catch(() => false))) {
      await mobileMenuButton.click()
    }
  }

  const button = page.getByRole('button', { name: /^Asientos$/ })
  const link = page.getByRole('link', { name: 'Registro manual' })

  if (await button.isVisible().catch(() => false)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await button.click()
      await page.waitForTimeout(120)
      if (await link.isVisible().catch(() => false)) {
        break
      }
    }
  }

  await expect(link).toBeVisible()
}

export async function openSupervisionMenu(page: Page) {
  const button = page.getByRole('button', { name: 'Supervision' })
  const link = page.getByRole('link', { name: 'Panel docente' })

  if (await button.isVisible().catch(() => false)) {
    await button.click()
    if (!(await link.isVisible().catch(() => false))) {
      await button.click()
    }
  }

  await expect(link).toBeVisible()
}

export async function selectActiveCompany(page: Page, companyName: string) {
  const selector = page.locator('nav select:visible').first()
  await expect(selector).toBeVisible()
  await selector.selectOption({ label: companyName })

  const currentSelector = page.locator('nav select:visible').first()
  await expect(currentSelector.locator('option:checked')).toContainText(companyName)

  const selectedValue = await currentSelector.inputValue()
  await page.waitForFunction((expectedCompanyId) => {
    const raw = globalThis.localStorage.getItem('active-company-storage')
    if (!raw) return false
    return (
      raw.includes(`"activeCompanyId":"${expectedCompanyId}"`) ||
      raw.includes(`"activeCompanyId":${expectedCompanyId}`)
    )
  }, selectedValue)
}
