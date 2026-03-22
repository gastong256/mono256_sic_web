import { expect, test, type Page } from '@playwright/test'
import {
  clearSession,
  loginAs,
  navigateFromVisibleLink,
  openAsientosMenu,
  openSupervisionMenu,
  selectActiveCompany,
  uniqueName,
} from './support/session'

async function openTeacherDashboard(page: Page) {
  await openSupervisionMenu(page)
  await navigateFromVisibleLink(page, '/teacher/dashboard', /\/teacher\/dashboard/)
}

test.describe('Teacher critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
  })

  test('creates a new course from the teacher dashboard', async ({ page }) => {
    const courseName = uniqueName('Curso E2E')

    await loginAs(page, 'teacher')
    await openTeacherDashboard(page)

    await expect(page).toHaveURL('/teacher/dashboard')
    await expect(page.getByRole('heading', { name: 'Panel docente' })).toBeVisible()
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
    await openTeacherDashboard(page)
    await expect(page).toHaveURL('/teacher/dashboard')
    await expect(page.getByRole('heading', { name: 'Panel docente' })).toBeVisible()

    const coursePanel = page.locator('section', { hasText: 'Contabilidad I' }).first()
    await expect(coursePanel).toBeVisible()

    await coursePanel.getByRole('button', { name: 'Enrolar alumno' }).click()

    const enrollDialog = page.getByRole('dialog', { name: /enrolar alumno en Contabilidad I/i })
    await enrollDialog.getByLabel('Buscar alumno').fill('Alumno 01')
    const availableRow = enrollDialog
      .getByRole('listitem')
      .filter({ hasText: '@student11' })
      .first()
    await availableRow.getByRole('button', { name: 'Inscribir' }).click()

    await expect(page.getByText('Alumno enrolado correctamente.')).toBeVisible()
    await enrollDialog.getByRole('button', { name: 'Cerrar' }).click()

    await expect(coursePanel.getByText(/@student11/i)).toBeVisible()

    const sofiaRow = coursePanel.locator('li', { hasText: '@student1' }).first()
    await sofiaRow.getByRole('link', { name: 'Ver detalle' }).click()

    await expect(page).toHaveURL(/\/teacher\/students\/\d+\?courseId=1/)
    await expect(page.getByRole('heading', { name: 'Detalle de alumno' })).toBeVisible()

    await page.getByRole('button', { name: /Ferretería Los Andes/i }).click()
    await expect(page.getByText(/Resumen contable de Ferretería Los Andes/i)).toBeVisible()
  })

  test('teacher can hide and show a published demo for a course', async ({ page }) => {
    await loginAs(page, 'teacher')
    await openTeacherDashboard(page)

    const coursePanel = page.locator('section', { hasText: 'Contabilidad I' }).first()
    await expect(coursePanel).toBeVisible()
    await coursePanel.getByRole('button', { name: 'Visibilidad del curso' }).click()

    const dialog = page.getByRole('dialog', { name: /visibilidad del curso · contabilidad i/i })
    const demoCard = dialog.locator('article', { hasText: 'Demo Comercial Publicada' }).first()
    await expect(demoCard).toBeVisible()
    await demoCard.getByRole('button', { name: 'Ocultar en este curso' }).click()
    await expect(page.getByText('Demo oculta para este curso.')).toBeVisible()
    await expect(demoCard.getByText('Oculta en este curso')).toBeVisible()
    await expect(demoCard.getByRole('button', { name: 'Mostrar en este curso' })).toBeVisible()

    await demoCard.getByRole('button', { name: 'Mostrar en este curso' }).click()
    await expect(page.getByText('Demo visible para este curso.')).toBeVisible()
    await expect(demoCard.getByText('Visible en este curso')).toBeVisible()
    await expect(demoCard.getByRole('button', { name: 'Ocultar en este curso' })).toBeVisible()
  })

  test('teacher can hide and show a shared company and the student sees it read-only', async ({
    page,
  }) => {
    await loginAs(page, 'teacher')
    await openTeacherDashboard(page)

    const coursePanel = page.locator('section', { hasText: 'Contabilidad I' }).first()
    await expect(coursePanel).toBeVisible()
    await coursePanel.getByRole('button', { name: 'Visibilidad del curso' }).click()

    const dialog = page.getByRole('dialog', { name: /visibilidad del curso · contabilidad i/i })
    await expect(dialog.getByText('Ferretería Aula Docente')).toBeVisible()
    const sharedCard = dialog.locator('article', { hasText: 'Ferretería Aula Docente' }).first()

    await sharedCard.getByRole('button', { name: 'Ocultar en este curso' }).click()
    await expect(page.getByText('Empresa compartida oculta para este curso.')).toBeVisible()
    await expect(sharedCard.getByText('Oculta en este curso')).toBeVisible()
    await expect(sharedCard.getByRole('button', { name: 'Compartir con este curso' })).toBeVisible()

    await sharedCard.getByRole('button', { name: 'Compartir con este curso' }).click()
    await expect(page.getByText('Empresa compartida visible para este curso.')).toBeVisible()
    await expect(sharedCard.getByText('Visible en este curso')).toBeVisible()
    await page.keyboard.press('Escape')

    await loginAs(page, 'student')
    await selectActiveCompany(page, 'Ferretería Aula Docente')
    await page.getByRole('button', { name: 'Empresas' }).click()
    await expect(page).toHaveURL('/companies')
    await expect(page.locator('table').getByText('Ferretería Aula Docente')).toBeVisible()

    await openAsientosMenu(page)
    await navigateFromVisibleLink(page, '/journal', /\/journal/)
    await expect(
      page.getByText(
        'Esta empresa está en modo solo lectura. Podés consultar los asientos, pero no crear ni reversar operaciones.'
      )
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Nuevo asiento' })).toBeDisabled()
  })
})
