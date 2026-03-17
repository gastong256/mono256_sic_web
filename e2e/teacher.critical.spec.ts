import { expect, test } from '@playwright/test'
import { clearSession, loginAs, openSupervisionMenu, uniqueName } from './support/session'

test.describe('Teacher critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('creates a new course from the teacher dashboard', async ({ page }) => {
    const courseName = uniqueName('Curso E2E')

    await loginAs(page, 'teacher')
    await openSupervisionMenu(page)
    await page.locator('#menu-supervision').getByRole('link', { name: 'Panel docente' }).click()

    await expect(page).toHaveURL('/teacher/dashboard')
    await page.getByRole('button', { name: '+ Nuevo curso' }).click()

    const dialog = page.getByRole('dialog', { name: /crear nuevo curso/i })
    await dialog.getByLabel('Nombre del curso').fill(courseName)
    await dialog.getByLabel(/Codigo/).fill('E2E-CONT')
    await dialog.getByRole('button', { name: 'Crear curso' }).click()

    await expect(page.getByText('Curso creado correctamente.')).toBeVisible()
    await expect(page.getByRole('heading', { name: courseName })).toBeVisible()
  })

  test('enrolls a student and navigates to student detail', async ({ page }) => {
    await loginAs(page, 'teacher')
    await openSupervisionMenu(page)
    await page.locator('#menu-supervision').getByRole('link', { name: 'Panel docente' }).click()
    await expect(page).toHaveURL('/teacher/dashboard')

    const coursePanel = page.locator('section', { hasText: 'Contabilidad I' }).first()
    await expect(coursePanel).toBeVisible()

    await coursePanel.getByRole('button', { name: 'Enrolar alumno' }).click()

    const enrollDialog = page.getByRole('dialog', { name: /enrolar alumno en Contabilidad I/i })
    await enrollDialog.getByLabel('Buscar alumno').fill('Lucia')
    await enrollDialog.getByRole('button', { name: 'Inscribir' }).click()

    await expect(page.getByText('Alumno enrolado correctamente.')).toBeVisible()
    await enrollDialog.getByRole('button', { name: 'Cerrar' }).click()

    await expect(coursePanel.getByText(/lucia student/i)).toBeVisible()

    const sofiaRow = coursePanel.locator('li', { hasText: '@student1' }).first()
    await sofiaRow.getByRole('link', { name: 'Ver detalle' }).click()

    await expect(page).toHaveURL(/\/teacher\/students\/\d+\?courseId=1/)
    await expect(page.getByRole('heading', { name: 'Detalle de alumno' })).toBeVisible()

    await page.getByRole('button', { name: /Ferretería Los Andes/i }).click()
    await expect(page.getByText(/Resumen contable de Ferretería Los Andes/i)).toBeVisible()
  })
})
