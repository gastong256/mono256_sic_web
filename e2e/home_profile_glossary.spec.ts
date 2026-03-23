import { expect, test } from '@playwright/test'
import {
  clearSession,
  loginAs,
  navigateFromVisibleLink,
  selectActiveCompany,
} from './support/session'

test.describe('Home, profile and glossary flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('shows recent activity in home and expands the selected entry', async ({ page }) => {
    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Los Andes')

    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
    await expect(page.getByText('Actividad reciente')).toBeVisible()

    const recentEntry = page.getByRole('button', { name: /2026-01-15 Cobranza de mostrador/i })
    await recentEntry.click()
    await expect(page.getByText('4.01.01 - Ventas al Contado')).toBeVisible()
    await expect(page.getByText('1.01.01 - Caja en Pesos')).toBeVisible()
  })

  test('allows updating profile data', async ({ page }) => {
    const suffix = Date.now()

    await loginAs(page, 'student')
    await page.getByRole('button', { name: 'Perfil' }).click()
    await expect(page).toHaveURL('/profile')

    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()
    await page.getByRole('button', { name: 'Editar perfil' }).click()
    await page.getByLabel('Nombre').fill('Alumno')
    await page.getByLabel('Apellido').fill(`E2E ${suffix}`)
    await page.getByLabel('Email').fill(`student-e2e-${suffix}@local.test`)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByText('Perfil actualizado correctamente.')).toBeVisible()
    await expect(page.getByText(`Alumno E2E ${suffix}`).first()).toBeVisible()
    await expect(page.getByText(`student-e2e-${suffix}@local.test`).first()).toBeVisible()
  })

  test('renders the public glossary and lets users search and open a concept', async ({ page }) => {
    await page.goto('/')
    await navigateFromVisibleLink(page, '/glosario', /\/glosario/)

    await expect(page.getByRole('heading', { name: 'Glosario Contable' })).toBeVisible()
    await page.getByLabel('Buscar concepto o definición').fill('patri')
    await expect(page.getByText('Patrimonio Neto', { exact: true }).first()).toBeVisible()

    await page.locator('button[aria-pressed]').filter({ hasText: /^P$/ }).first().click()
    await page
      .locator('button', {
        has: page.getByText('Patrimonio Neto', { exact: true }),
      })
      .first()
      .click()

    await expect(page.locator('h2', { hasText: 'Patrimonio Neto' })).toBeVisible()
    await expect(
      page.getByText(/surge de la diferencia entre el Activo y el Pasivo/i).first()
    ).toBeVisible()
    await expect(page.getByText('Palabras clave')).toBeVisible()
  })

  test('protects the manual and shows only student-relevant flows to students', async ({
    page,
  }) => {
    await page.goto('/manual')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fmanual/)

    await loginAs(page, 'student')
    await navigateFromVisibleLink(page, '/manual', /\/manual$/)
    await expect(page.getByRole('heading', { name: 'Manual de Usuario' })).toBeVisible()
    await page.getByLabel('Buscar flujo o paso').fill('cierre')

    await expect(page.getByText('Cerrar ejercicio y ver Balance General')).toBeVisible()
    await page.getByRole('button', { name: /Cerrar ejercicio y ver Balance General/i }).click()

    await expect(
      page.getByRole('heading', { name: 'Cerrar ejercicio y ver Balance General' })
    ).toBeVisible()
    await expect(page.getByText(/Usá Preparar cierre/i)).toBeVisible()

    await page.getByLabel('Buscar flujo o paso').fill('')
    await expect(page.getByRole('button', { name: 'Docente' })).toHaveCount(0)
    await expect(page.getByText('Configurar plan de cuentas de mi empresa')).toBeVisible()
    await expect(page.getByText('Crear curso, enrolar y supervisar alumnos')).toHaveCount(0)
  })
})
