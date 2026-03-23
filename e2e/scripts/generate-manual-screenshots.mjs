/* global document, localStorage, sessionStorage */
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/manual-screenshots')
const VIEWPORT = { width: 1440, height: 960 }
const OUTPUT_WIDTH = 1200
const WEBP_QUALITY = 74

const accessTokenCache = new Map()

function parseEnvList(name) {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`)
  }
  return value
}

function requireEnvList(name) {
  const values = parseEnvList(name)
  if (values.length === 0) {
    throw new Error(`Falta la variable de entorno requerida o está vacía: ${name}`)
  }
  return values
}

const MANUAL_CONFIG = {
  apiBaseUrl: requireEnv('MANUAL_API_BASE_URL'),
  credentialsByRole: {
    teacher: [
      {
        username: requireEnv('MANUAL_TEACHER_USERNAME'),
        password: requireEnv('MANUAL_TEACHER_PASSWORD'),
      },
    ],
    student: [
      {
        username: requireEnv('MANUAL_STUDENT_USERNAME'),
        password: requireEnv('MANUAL_STUDENT_PASSWORD'),
      },
    ],
  },
  studentCompanies: {
    writableOperational: requireEnvList('MANUAL_STUDENT_OPERATIONAL_COMPANIES'),
    writablePending: requireEnvList('MANUAL_STUDENT_PENDING_COMPANIES'),
    books: requireEnvList('MANUAL_STUDENT_BOOKS_COMPANIES'),
    closing: requireEnvList('MANUAL_STUDENT_CLOSING_COMPANIES'),
  },
  teacherVisibility: {
    courseNames: requireEnvList('MANUAL_TEACHER_COURSE_NAMES'),
    demoCompanyNames: requireEnvList('MANUAL_COURSE_DEMO_COMPANIES'),
    sharedCompanyNames: requireEnvList('MANUAL_COURSE_SHARED_COMPANIES'),
    enrollableStudentQuery: requireEnv('MANUAL_ENROLLABLE_STUDENT_QUERY'),
  },
}

function screenshotPath(flow, file) {
  return path.join(OUTPUT_DIR, flow, file)
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true })
}

async function ensureOutputDir(flow) {
  await ensureDir(path.join(OUTPUT_DIR, flow))
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function saveWebp(buffer, outputPath) {
  await ensureDir(path.dirname(outputPath))
  await sharp(buffer)
    .resize({
      width: OUTPUT_WIDTH,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath)
}

async function capturePage(page, flow, file) {
  const buffer = await page.screenshot({
    type: 'png',
    fullPage: false,
    animations: 'disabled',
  })
  await saveWebp(buffer, screenshotPath(flow, file))
}

async function captureLocator(locator, flow, file) {
  await locator.scrollIntoViewIfNeeded()
  const buffer = await locator.screenshot({
    type: 'png',
    animations: 'disabled',
  })
  await saveWebp(buffer, screenshotPath(flow, file))
}

async function resetSession(page) {
  await page.goto(`${BASE_URL}/login`)
  await page.context().clearCookies()
  await page.evaluate(() => {
    // Browser context
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto(`${BASE_URL}/login`)
  await page.getByLabel('Usuario').waitFor({ state: 'visible' })
  await page.getByRole('form', { name: /inicio de sesión/i }).waitFor({ state: 'visible' })
}

async function loginAs(page, role) {
  const candidates = MANUAL_CONFIG.credentialsByRole[role]
  if (!candidates) throw new Error(`Rol no soportado: ${role}`)

  let lastError = null

  for (const credentials of candidates) {
    await resetSession(page)
    await page.getByLabel('Usuario').fill(credentials.username)
    await page.getByLabel('Contraseña').fill(credentials.password)
    await page.getByRole('button', { name: 'Ingresar' }).click()

    try {
      await page.getByRole('button', { name: 'Salir' }).waitFor({
        state: 'visible',
        timeout: 10_000,
      })
      await page.waitForLoadState('networkidle')
      return credentials
    } catch (error) {
      lastError = error
    }
  }

  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '')
  throw new Error(
    `No se pudo iniciar sesión como ${role}. URL actual: ${page.url()}\n\n${bodyText}`,
    { cause: lastError }
  )
}

async function apiJson(pathname, options = {}) {
  const response = await fetch(`${MANUAL_CONFIG.apiBaseUrl}${pathname}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : null),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : null),
      ...(options.headers ?? null),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : null),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${response.status} ${pathname}: ${text}`)
  }

  return response.json()
}

async function apiLogin(role) {
  const credentials = MANUAL_CONFIG.credentialsByRole[role]?.[0]
  if (!credentials) throw new Error(`No hay credenciales API para ${role}`)
  return apiJson('/auth/token/', {
    method: 'POST',
    body: credentials,
  })
}

async function getAccessTokenForRole(role) {
  if (accessTokenCache.has(role)) return accessTokenCache.get(role)
  const tokens = await apiLogin(role)
  accessTokenCache.set(role, tokens.access)
  return tokens.access
}

async function getCompanyDetailByName(role, companyName) {
  const token = await getAccessTokenForRole(role)
  const me = await apiJson('/auth/me/?include=companies', { token })
  const company = (me.companies ?? []).find((candidate) => candidate?.name === companyName)
  if (!company?.id) {
    throw new Error(`No se encontró la empresa "${companyName}" para el rol ${role}.`)
  }
  return apiJson(`/companies/${company.id}/`, { token })
}

async function getCompanyClosingStateByName(role, companyName) {
  const token = await getAccessTokenForRole(role)
  const me = await apiJson('/auth/me/?include=companies', { token })
  const company = (me.companies ?? []).find((candidate) => candidate?.name === companyName)
  if (!company?.id) {
    throw new Error(`No se encontró la empresa "${companyName}" para el rol ${role}.`)
  }
  return apiJson(`/companies/${company.id}/closing/state/`, { token })
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getNextOperationalDate(booksClosedUntil) {
  if (!booksClosedUntil) return new Date().toISOString().slice(0, 10)
  return addDays(booksClosedUntil, 1)
}

function getExerciseYearEnd(startDate) {
  const year = Number.parseInt(String(startDate).slice(0, 4), 10)
  if (!Number.isFinite(year)) {
    throw new Error(`No se pudo resolver el fin del ejercicio para la fecha ${startDate}.`)
  }
  return `${year}-12-31`
}

async function openMenuFromTopNav(page, buttonName, linkName) {
  const button = page.getByRole('button', { name: buttonName })
  const link = page.getByRole('link', { name: linkName })

  if (await button.isVisible().catch(() => false)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await button.click()
      await page.waitForTimeout(120)
      if (await link.isVisible().catch(() => false)) break
    }
  }

  await link.waitFor({ state: 'visible' })
}

async function openBooksMenu(page) {
  await openMenuFromTopNav(page, /^Libros$/, 'Libro Diario')
}

async function openAsientosMenu(page) {
  await openMenuFromTopNav(page, /^Asientos$/, 'Registro manual')
}

async function openSupervisionMenu(page) {
  await openMenuFromTopNav(page, 'Supervision', 'Panel docente')
}

async function openTeacherDashboard(page) {
  const heading = page.getByRole('heading', { name: 'Panel docente' })
  if (await heading.isVisible().catch(() => false)) return

  const supervisionButton = page.getByRole('button', { name: 'Supervision' })
  await supervisionButton.waitFor({ state: 'visible' })
  await openSupervisionMenu(page)
  await navigateVisibleLink(page, '/teacher/dashboard')
  await heading.waitFor({ state: 'visible' })
}

async function openChartVisibilityPage(page) {
  const heading = page.getByRole('heading', { name: 'Visibilidad del plan de cuentas' })
  if (await heading.isVisible().catch(() => false)) return

  const supervisionButton = page.getByRole('button', { name: 'Supervision' })
  await supervisionButton.waitFor({ state: 'visible' })
  await openSupervisionMenu(page)
  await navigateVisibleLink(page, '/settings/chart-visibility')
  await heading.waitFor({ state: 'visible' })
}

async function navigateVisibleLink(page, href) {
  const link = page.locator(`a[href="${href}"]:visible`).first()
  await link.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    link.click(),
  ])
  await page.waitForLoadState('networkidle')
}

async function selectActiveCompany(page, companyName) {
  await page.goto(`${BASE_URL}/`)
  await page.waitForLoadState('networkidle')
  const selector = page.locator('nav select:visible').first()
  await selector.waitFor({ state: 'visible' })
  await selector.selectOption({ label: companyName })
  await page.waitForFunction(
    (expectedCompanyName) => {
      // Browser context
      const select = document.querySelector('nav select')
      const checked = select?.selectedOptions?.[0]?.textContent?.trim()
      return checked === expectedCompanyName
    },
    companyName,
    { timeout: 10_000 }
  )
  await page.waitForLoadState('networkidle')
}

async function companyEntry(page, companyName) {
  const link = page.getByRole('link', { name: companyName, exact: true }).first()
  if (await link.isVisible().catch(() => false)) return link

  const button = page.getByRole('button', { name: companyName, exact: true }).first()
  if (await button.isVisible().catch(() => false)) return button

  const cell = page.getByRole('cell', { name: companyName, exact: true }).first()
  if (await cell.isVisible().catch(() => false)) return cell

  return null
}

async function openCompaniesPage(page) {
  await page.goto(`${BASE_URL}/companies`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('heading', { name: 'Empresas' }).waitFor({ state: 'visible' })
}

async function openCompaniesPageFromNav(page) {
  const companiesButton = page.getByRole('button', { name: 'Empresas' })
  await companiesButton.waitFor({ state: 'visible' })
  await companiesButton.click()
  await page.waitForURL(/\/companies$/)
  await page.getByRole('heading', { name: 'Empresas' }).waitFor({ state: 'visible' })
}

async function resolveCompanyName(page, preferredNames) {
  await openCompaniesPage(page)

  for (const companyName of preferredNames) {
    const entry = await companyEntry(page, companyName)
    if (entry) return companyName
  }

  const visibleNames = await page
    .locator('main')
    .locator('a, button, td')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => node.textContent?.trim() ?? '')
        .filter((text) => text.length > 0)
        .slice(0, 80)
    )

  throw new Error(
    `No se encontró ninguna empresa preferida entre: ${preferredNames.join(', ')}.\nVisibles: ${visibleNames.join(' | ')}`
  )
}

async function resolveStudentCompanyTargets(page, state) {
  state.studentOperationalCompanyName = await resolveCompanyName(
    page,
    MANUAL_CONFIG.studentCompanies.writableOperational
  )
  state.studentPendingCompanyName = await resolveCompanyName(
    page,
    MANUAL_CONFIG.studentCompanies.writablePending
  )
  state.studentBooksCompanyName = await resolveCompanyName(
    page,
    MANUAL_CONFIG.studentCompanies.books
  )
  state.studentClosingCompanyName = await resolveCompanyName(
    page,
    MANUAL_CONFIG.studentCompanies.closing
  )

  const operationalCompany = await getCompanyDetailByName(
    'student',
    state.studentOperationalCompanyName
  )
  const closingCompany = await getCompanyDetailByName('student', state.studentClosingCompanyName)
  const closingState = await getCompanyClosingStateByName(
    'student',
    state.studentClosingCompanyName
  )
  const closingExerciseStartDate = closingState?.current_exercise?.start_date

  state.studentOperationalEntryDate = getNextOperationalDate(
    operationalCompany.books_closed_until ?? null
  )
  state.studentClosingDate = closingExerciseStartDate
    ? getExerciseYearEnd(closingExerciseStartDate)
    : getNextOperationalDate(closingCompany.books_closed_until ?? null)
  state.studentReopeningDate = addDays(state.studentClosingDate, 1)
}

async function fillDescriptionField(container, value) {
  const labelMatch = container.getByLabel('Descripción')
  if (await labelMatch.isVisible().catch(() => false)) {
    await labelMatch.fill(value)
    return
  }

  const textarea = container.locator('textarea').first()
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill(value)
  }
}

async function getSelectableOptionLabels(selectLocator) {
  return selectLocator.evaluate((element) =>
    Array.from(element.options)
      .map((option) => option.label.trim())
      .filter((label) => label.length > 0 && !/^seleccion/i.test(label))
  )
}

async function openCompanyDetail(page, companyName) {
  await page.goto(`${BASE_URL}/companies`)
  await page.waitForLoadState('networkidle')
  const entry = await companyEntry(page, companyName)
  if (!entry) throw new Error(`No se encontró la empresa "${companyName}" en /companies`)
  await entry.click()
  await page.waitForURL(/\/companies\/\d+/)
  await page.getByRole('heading', { name: 'Plan de cuentas' }).waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
}

async function openAddLevelTwoAccountModal(page) {
  const addButton = page.getByRole('button', { name: '+ Agregar cuenta' }).first()
  await addButton.waitFor({ state: 'visible' })
  await addButton.click()
  const dialog = page.getByRole('dialog', { name: /nueva cuenta de movimiento/i })
  await dialog.waitFor({ state: 'visible' })
  return dialog
}

async function createStudentCompanyWithOpening(page, state) {
  const companyName = `Guia Empresa ${Date.now()}`
  const sourceRef = `MAN-${Date.now()}`
  state.createdCompanyName = companyName
  state.createdCompanySourceRef = sourceRef

  await openCompaniesPage(page)
  await page.getByRole('button', { name: 'Nueva empresa' }).waitFor({ state: 'visible' })
  await capturePage(page, 'crear-empresa-apertura', '01-lista-empresas.webp')

  await page.getByRole('button', { name: 'Nueva empresa' }).click()
  const dialog = page.getByRole('dialog', { name: /nueva empresa/i })
  await dialog.getByLabel('Nombre').fill(companyName)
  await dialog.getByLabel('CUIT').fill('30-55555555-5')
  await fillDescriptionField(dialog, 'Empresa de referencia para el manual')
  await captureLocator(dialog, 'crear-empresa-apertura', '02-formulario-empresa.webp')

  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await dialog.getByLabel('Referencia').fill(sourceRef)
  await dialog.getByLabel('Cuenta movimiento').fill('Caja Manual')
  await dialog.getByLabel('Importe').fill('1800.00')
  await captureLocator(dialog, 'crear-empresa-apertura', '03-apertura-contable.webp')

  await dialog.getByRole('button', { name: 'Crear empresa y apertura' }).click()
  await page.getByText('Empresa creada y lista para operar.').waitFor({ state: 'visible' })
  await openCompanyDetail(page, companyName)
  await capturePage(page, 'crear-empresa-apertura', '04-empresa-operativa.webp')
}

async function capturePlanDeCuentas(page, state) {
  await openCompanyDetail(page, state.studentOperationalCompanyName)
  await capturePage(page, 'configurar-plan-cuentas', '01-detalle-empresa.webp')

  await openCompanyDetail(page, state.studentPendingCompanyName)
  await capturePage(page, 'configurar-plan-cuentas', '02-arbol-cuentas.webp')

  await openCompanyDetail(page, state.studentOperationalCompanyName)
  const dialog = await openAddLevelTwoAccountModal(page)
  await dialog.getByLabel('Nombre').fill(`Cuenta Manual ${Date.now()}`)
  await dialog.getByLabel('Código').fill('1.01.99')
  await captureLocator(dialog, 'configurar-plan-cuentas', '03-rubros-cuentas.webp')
  await page.keyboard.press('Escape')
}

async function captureRegistroManual(page, state) {
  const description = `Asiento manual ${Date.now()}`
  state.manualEntryDescription = description

  await selectActiveCompany(page, state.studentOperationalCompanyName)
  await openAsientosMenu(page)
  await navigateVisibleLink(page, '/journal')
  await page.getByRole('heading', { name: 'Asientos' }).waitFor({ state: 'visible' })
  await capturePage(page, 'registrar-asientos', '01-registro-manual.webp')

  await page.getByRole('button', { name: '+ Nuevo asiento' }).click()
  const dialog = page.getByRole('dialog', { name: /nuevo asiento/i })
  await dialog.locator('input[type="date"]').first().fill(state.studentOperationalEntryDate)
  await dialog.getByPlaceholder('Concepto del asiento').fill(description)
  await captureLocator(dialog, 'registrar-asientos', '02-fecha-descripcion.webp')

  const accountSelects = dialog.locator('select')
  const debitOptions = await getSelectableOptionLabels(accountSelects.nth(0))
  const creditOptions = await getSelectableOptionLabels(accountSelects.nth(1))
  const debitLabel = debitOptions[0]
  const creditLabel =
    creditOptions.find((label) => label !== debitLabel) ??
    debitOptions.find((label) => label !== debitLabel)

  if (!debitLabel || !creditLabel) {
    throw new Error(
      'No hay suficientes cuentas de movimiento disponibles para capturar el asiento.'
    )
  }

  await accountSelects.nth(0).selectOption({ label: debitLabel })
  await accountSelects.nth(1).selectOption({ label: creditLabel })

  const amountInputs = dialog.locator('input[placeholder="0.00"]')
  await amountInputs.nth(0).fill('1234.56')
  await amountInputs.nth(3).fill('1234.56')
  await captureLocator(dialog, 'registrar-asientos', '03-lineas-balanceo.webp')

  await dialog.getByRole('button', { name: 'Guardar asiento' }).click()
  await page.getByText('Asiento registrado correctamente.').waitFor({ state: 'visible' })
  await page.getByText(description).waitFor({ state: 'visible' })
  await capturePage(page, 'registrar-asientos', '04-asiento-guardado.webp')
}

async function captureReportes(page, state) {
  await selectActiveCompany(page, state.studentBooksCompanyName)
  await page.goto(`${BASE_URL}/`)
  await page.waitForLoadState('networkidle')
  await openBooksMenu(page)
  await capturePage(page, 'ver-libros', '01-menu-libros.webp')

  await navigateVisibleLink(page, '/reports/journal-book')
  await page.getByRole('heading', { name: 'Libro Diario' }).waitFor({ state: 'visible' })
  await capturePage(page, 'ver-libros', '02-libro-diario.webp')

  await openBooksMenu(page)
  await navigateVisibleLink(page, '/reports/ledger')
  await page.getByRole('heading', { name: 'Libro Mayor' }).waitFor({ state: 'visible' })
  await capturePage(page, 'ver-libros', '03-libro-mayor.webp')

  await openBooksMenu(page)
  await navigateVisibleLink(page, '/reports/trial-balance')
  await page.getByRole('heading', { name: 'Balance de Comprobacion' }).waitFor({
    state: 'visible',
  })
  await capturePage(page, 'ver-libros', '04-balance-comprobacion.webp')
}

async function captureCierre(page, state) {
  await selectActiveCompany(page, state.studentClosingCompanyName)
  await page.goto(`${BASE_URL}/reports/closing`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('heading', { name: 'Balance General y Cierres' }).waitFor({
    state: 'visible',
  })
  await capturePage(page, 'cerrar-ejercicio', '01-balance-y-cierres.webp')

  await page.getByRole('button', { name: 'Preparar cierre' }).click()
  const prepareDialog = page.getByRole('dialog', { name: /preparar cierre contable/i })
  await prepareDialog.getByLabel('Fecha de cierre').fill(state.studentClosingDate)
  await prepareDialog.getByLabel('Fecha de reapertura').fill(state.studentReopeningDate)
  await captureLocator(prepareDialog, 'cerrar-ejercicio', '02-preparar-cierre.webp')

  await prepareDialog.getByRole('button', { name: 'Ver preview' }).click()
  const previewDialog = page.getByRole('dialog', { name: /confirmar cierre contable/i })
  await previewDialog.waitFor({ state: 'visible' })
  await captureLocator(previewDialog, 'cerrar-ejercicio', '03-preview-cierre.webp')

  await previewDialog.getByRole('button', { name: 'Ejecutar cierre' }).click()
  await page.getByRole('heading', { name: /Cierre confirmado/i }).waitFor({ state: 'visible' })
  await capturePage(page, 'cerrar-ejercicio', '04-cierre-confirmado.webp')
}

async function resolveCoursePanel(page, preferredCourseName = null) {
  if (preferredCourseName) {
    const preferred = page.locator('section', { hasText: preferredCourseName }).first()
    if (await preferred.isVisible().catch(() => false)) return preferred
  }

  const firstPanel = page.locator('section.surface-card').first()
  await firstPanel.waitFor({ state: 'visible' })
  return firstPanel
}

async function captureTeacherFlow(page, state) {
  const courseName = `Curso Captura ${Date.now()}`
  const courseCode = `MAN-${String(Date.now()).slice(-4)}`
  state.createdCourseName = courseName

  await openTeacherDashboard(page)
  await page.getByRole('heading', { name: 'Panel docente' }).waitFor({ state: 'visible' })
  await capturePage(page, 'gestionar-curso-alumnos', '01-panel-docente.webp')

  await page.getByRole('button', { name: '+ Nuevo curso' }).click()
  const createDialog = page.getByRole('dialog', { name: /crear nuevo curso/i })
  await createDialog.getByLabel('Nombre del curso').fill(courseName)
  await createDialog.getByLabel(/Codigo/).fill(courseCode)
  await captureLocator(createDialog, 'gestionar-curso-alumnos', '02-crear-curso.webp')

  await createDialog.getByRole('button', { name: 'Crear curso' }).click()
  await page.getByText('Curso creado correctamente.').waitFor({ state: 'visible' })
  const createdCoursePanel = page.locator('section', { hasText: courseName }).first()
  await createdCoursePanel.waitFor({ state: 'visible' })
  await createdCoursePanel.getByRole('button', { name: 'Enrolar alumno' }).click()
  const enrollDialog = page.getByRole('dialog', { name: /enrolar alumno/i })
  await enrollDialog.waitFor({ state: 'visible' })
  await enrollDialog
    .getByLabel('Buscar alumno')
    .fill(MANUAL_CONFIG.teacherVisibility.enrollableStudentQuery)
  const firstAvailableRow = enrollDialog
    .getByRole('listitem')
    .filter({ hasText: MANUAL_CONFIG.teacherVisibility.enrollableStudentQuery })
    .first()
  await firstAvailableRow.waitFor({ state: 'visible', timeout: 15_000 })
  await captureLocator(enrollDialog, 'gestionar-curso-alumnos', '03-enrolar-alumno.webp')
  await firstAvailableRow.getByRole('button', { name: 'Inscribir' }).click()
  await page.getByText(/Alumno enrolado correctamente/i).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Cerrar' }).click()

  await createdCoursePanel.getByRole('link', { name: 'Ver detalle' }).first().click()
  await page.getByRole('heading', { name: 'Detalle de alumno' }).waitFor({ state: 'visible' })
  await capturePage(page, 'gestionar-curso-alumnos', '04-supervision-alumno.webp')
}

async function captureVisibilityFlow(page) {
  await openChartVisibilityPage(page)
  await capturePage(page, 'definir-arbol-demos', '01-visibilidad-arbol.webp')

  await openTeacherDashboard(page)
  const preferredCourseName = MANUAL_CONFIG.teacherVisibility.courseNames[0] ?? null
  const coursePanel =
    (await resolveCoursePanel(page, preferredCourseName).catch(() => null)) ??
    (await resolveCoursePanel(page, null))
  await coursePanel.getByRole('button', { name: 'Visibilidad del curso' }).click()
  let dialog = page.getByRole('dialog', { name: /visibilidad del curso/i })
  await dialog.waitFor({ state: 'visible' })

  const demosSection = dialog
    .locator('section', {
      has: dialog.getByText(
        new RegExp(
          MANUAL_CONFIG.teacherVisibility.demoCompanyNames
            .map((name) => normalizeText(name))
            .join('|'),
          'i'
        )
      ),
    })
    .first()
  if (!(await demosSection.isVisible().catch(() => false))) {
    const fallbackDemosSection = dialog.locator('section', { hasText: 'Empresas demo' }).first()
    await captureLocator(fallbackDemosSection, 'definir-arbol-demos', '02-demos-del-curso.webp')
  } else {
    await captureLocator(demosSection, 'definir-arbol-demos', '02-demos-del-curso.webp')
  }

  const sharedSection = dialog.locator('section', { hasText: 'Empresas compartidas' }).first()
  await sharedSection.scrollIntoViewIfNeeded()
  await captureLocator(sharedSection, 'definir-arbol-demos', '03-empresas-compartidas.webp')
  const sharedArticle = sharedSection
    .locator('article')
    .filter({
      hasText: new RegExp(
        MANUAL_CONFIG.teacherVisibility.sharedCompanyNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|'),
        'i'
      ),
    })
    .first()
  if (await sharedArticle.isVisible().catch(() => false)) {
    const shareButton = sharedArticle.getByRole('button', {
      name: /Compartir con este curso|Mostrar en este curso/i,
    })
    if (await shareButton.isVisible().catch(() => false)) {
      await shareButton.click()
      await page.waitForTimeout(300)
    }
  }
  await page.keyboard.press('Escape')

  await loginAs(page, 'student')
  await openCompaniesPageFromNav(page)
  await capturePage(page, 'definir-arbol-demos', '04-resultado-alumno.webp')
}

async function main() {
  const flows = [
    'crear-empresa-apertura',
    'configurar-plan-cuentas',
    'registrar-asientos',
    'ver-libros',
    'cerrar-ejercicio',
    'gestionar-curso-alumnos',
    'definir-arbol-demos',
  ]
  await Promise.all(flows.map(ensureOutputDir))

  const browser = await chromium.launch({ chromiumSandbox: false })
  const page = await browser.newPage({ viewport: VIEWPORT })
  const state = {}

  try {
    await loginAs(page, 'student')
    await createStudentCompanyWithOpening(page, state)
    await resolveStudentCompanyTargets(page, state)
    await capturePlanDeCuentas(page, state)
    await captureRegistroManual(page, state)
    await captureReportes(page, state)
    await captureCierre(page, state)

    await loginAs(page, 'teacher')
    await captureTeacherFlow(page, state)
    await captureVisibilityFlow(page)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
