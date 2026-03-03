import type { Company } from '@/features/companies/types/company.types'
import type {
  CreateJournalEntryPayload,
  JournalEntry,
  JournalEntryDetail,
  JournalLine,
  JournalLineType,
} from '@/features/journal/types/journal.types'
import type { AccountLevelConfig, Role, TeacherDashboardResponse, User } from '@/shared/types'

type MockUserRecord = User & { password: string }

type Course = {
  id: number
  name: string
  code: string | null
  teacher_id: number
  teacher_username: string
  student_usernames: string[]
  created_at: string
  updated_at: string
}

type Session = {
  username: string
  refresh: string
}

type RegisterPayload = {
  username: string
  password: string
  password_confirm: string
  email?: string
  first_name?: string
  last_name?: string
  registration_code: string
}

const users: MockUserRecord[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Ada',
    last_name: 'Admin',
    is_staff: true,
    role: 'admin',
    course_id: null,
    date_joined: '2024-01-10T10:00:00Z',
    password: 'password',
  },
  {
    id: 2,
    username: 'teacher1',
    email: 'teacher1@example.com',
    first_name: 'Tomas',
    last_name: 'Teacher',
    is_staff: true,
    role: 'teacher',
    course_id: null,
    date_joined: '2024-01-15T11:00:00Z',
    password: 'password',
  },
  {
    id: 3,
    username: 'student1',
    email: 'student1@example.com',
    first_name: 'Sofía',
    last_name: 'Student',
    is_staff: false,
    role: 'student',
    course_id: 1,
    date_joined: '2024-02-01T09:00:00Z',
    password: 'password',
  },
  {
    id: 4,
    username: 'student2',
    email: 'student2@example.com',
    first_name: 'Pedro',
    last_name: 'Student',
    is_staff: false,
    role: 'student',
    course_id: 1,
    date_joined: '2024-02-03T09:30:00Z',
    password: 'password',
  },
  {
    id: 5,
    username: 'student3',
    email: 'student3@example.com',
    first_name: 'Lucia',
    last_name: 'Student',
    is_staff: false,
    role: 'student',
    course_id: null,
    date_joined: '2024-02-05T09:30:00Z',
    password: 'password',
  },
]

const courses: Course[] = [
  {
    id: 1,
    name: 'Contabilidad I',
    code: 'CONT-I',
    teacher_id: 2,
    teacher_username: 'teacher1',
    student_usernames: ['student1', 'student2'],
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
  },
]
let nextCourseId = 2

let nextUserId = 6
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 5
const REGISTER_RATE_LIMIT_WINDOW_MS = 60_000
let registerAttemptsTimestamps: number[] = []

let registrationCodeState = {
  code: 'SIC-2026',
  window_minutes: 60,
  allow_previous_window: true,
  valid_from: new Date().toISOString(),
  valid_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

let nextCompanyId = 5
const companies: Company[] = [
  {
    id: 1,
    name: 'Ferretería Los Andes',
    tax_id: '20-12345678-9',
    owner_username: 'student1',
    account_count: 3,
    books_closed_until: null,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Librería del Centro',
    tax_id: null,
    owner_username: 'student1',
    account_count: 2,
    books_closed_until: null,
    created_at: '2024-03-15T14:30:00Z',
    updated_at: '2024-03-15T14:30:00Z',
  },
  {
    id: 3,
    name: 'Panadería San Martín',
    tax_id: '27-98765432-1',
    owner_username: 'student2',
    account_count: 0,
    books_closed_until: null,
    created_at: '2024-04-01T09:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
  {
    id: 4,
    name: 'Academia Central',
    tax_id: '30-77889966-3',
    owner_username: 'admin',
    account_count: 1,
    books_closed_until: null,
    created_at: '2024-04-20T09:00:00Z',
    updated_at: '2024-04-20T09:00:00Z',
  },
]

let nextJournalId = 20
const journalEntries: JournalEntryDetail[] = [
  {
    id: 1,
    entry_number: 1,
    date: '2024-03-01',
    description: 'Apertura',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 50000,
    total_credit: 50000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '50000.00',
      },
      {
        account_id: 302,
        account_code: '1.01.02',
        account_name: 'Banco Nación Cta. Cte.',
        type: 'CREDIT',
        amount: '50000.00',
      },
    ],
  },
  {
    id: 2,
    entry_number: 2,
    date: '2024-03-15',
    description: 'Pago de sueldos',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 120000,
    total_credit: 120000,
    lines: [
      {
        account_id: 303,
        account_code: '5.02.01',
        account_name: 'Sueldos y Jornales',
        type: 'DEBIT',
        amount: '120000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '120000.00',
      },
    ],
  },
  {
    id: 3,
    entry_number: 1,
    date: '2024-03-10',
    description: 'Venta al contado',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student2',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 30000,
    total_credit: 30000,
    lines: [
      {
        account_id: 310,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '30000.00',
      },
      {
        account_id: 311,
        account_code: '4.01.01',
        account_name: 'Ventas',
        type: 'CREDIT',
        amount: '30000.00',
      },
    ],
  },
]

const journalCompanyMap: Record<number, number> = {
  1: 1,
  2: 1,
  3: 3,
}

let accountChartConfig: AccountLevelConfig[] = [
  { account_id: 1, level: 1, code: '1', name: 'Activo', visible: true },
  { account_id: 2, level: 1, code: '2', name: 'Pasivo', visible: true },
  { account_id: 3, level: 1, code: '3', name: 'Patrimonio Neto', visible: true },
  { account_id: 4, level: 1, code: '4', name: 'Ingresos', visible: true },
  { account_id: 5, level: 1, code: '5', name: 'Egresos', visible: true },
  { account_id: 11, level: 2, code: '1.01', name: 'Caja y Bancos', visible: true },
  { account_id: 12, level: 2, code: '1.02', name: 'Créditos', visible: true },
  { account_id: 13, level: 2, code: '1.03', name: 'Bienes de Cambio', visible: true },
  { account_id: 14, level: 2, code: '1.04', name: 'Bienes de Uso', visible: true },
  { account_id: 21, level: 2, code: '2.01', name: 'Deudas Comerciales', visible: true },
  { account_id: 22, level: 2, code: '2.02', name: 'Deudas Bancarias', visible: true },
  { account_id: 23, level: 2, code: '2.03', name: 'Deudas Fiscales', visible: true },
  { account_id: 31, level: 2, code: '3.01', name: 'Capital', visible: true },
  { account_id: 32, level: 2, code: '3.02', name: 'Resultados', visible: true },
  { account_id: 41, level: 2, code: '4.01', name: 'Ventas', visible: true },
  { account_id: 42, level: 2, code: '4.02', name: 'Otros Ingresos', visible: true },
  { account_id: 51, level: 2, code: '5.01', name: 'Costo de Ventas', visible: true },
  { account_id: 52, level: 2, code: '5.02', name: 'Gastos Operativos', visible: true },
  { account_id: 53, level: 2, code: '5.03', name: 'Gastos Financieros', visible: true },
]

const sessionsByRefreshToken = new Map<string, Session>()

function makeMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${header}.${body}.mock-signature`
}

function makeAccessToken(user: User): string {
  return makeMockJwt({
    user_id: user.id,
    username: user.username,
    is_staff: user.is_staff,
    role: user.role,
    exp: 9999999999,
  })
}

function makeRefreshToken(user: User): string {
  return `mock-refresh-${user.username}-${Date.now()}`
}

function toPublicUser(user: MockUserRecord): User {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export function getUserByUsername(username: string): User | null {
  const user = users.find((candidate) => candidate.username === username)
  return user ? toPublicUser(user) : null
}

export function listUsers(): User[] {
  return users.map(toPublicUser)
}

function trimRegisterAttemptsWindow(now: number) {
  registerAttemptsTimestamps = registerAttemptsTimestamps.filter(
    (timestamp) => now - timestamp < REGISTER_RATE_LIMIT_WINDOW_MS
  )
}

function getRateLimitRetryAfter(now: number): number {
  if (!registerAttemptsTimestamps.length) return 0
  const oldest = Math.min(...registerAttemptsTimestamps)
  const retryAfterMs = REGISTER_RATE_LIMIT_WINDOW_MS - (now - oldest)
  return retryAfterMs > 0 ? Math.ceil(retryAfterMs / 1000) : 0
}

function bumpRegisterAttempts(now: number) {
  registerAttemptsTimestamps.push(now)
  trimRegisterAttemptsWindow(now)
}

function ensureRegistrationCodeValidity() {
  const now = Date.now()
  if (new Date(registrationCodeState.valid_until).getTime() > now) return
  rotateRegistrationCode()
}

export function getRegistrationCode(): {
  code: string
  window_minutes: number
  allow_previous_window: boolean
  valid_from: string
  valid_until: string
} {
  ensureRegistrationCodeValidity()
  return { ...registrationCodeState }
}

function generateRegistrationCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'SIC-'
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export function rotateRegistrationCode(): {
  code: string
  window_minutes: number
  allow_previous_window: boolean
  valid_from: string
  valid_until: string
} {
  const validFrom = new Date()
  const windowMinutes = 60
  registrationCodeState = {
    code: generateRegistrationCode(),
    window_minutes: windowMinutes,
    allow_previous_window: true,
    valid_from: validFrom.toISOString(),
    valid_until: new Date(validFrom.getTime() + windowMinutes * 60 * 1000).toISOString(),
  }
  return getRegistrationCode()
}

export function registerStudent(
  payload: RegisterPayload
):
  | { status: 201; user: User }
  | { status: 400; errors: Record<string, string[]> }
  | { status: 429; retry_after: number } {
  const now = Date.now()
  trimRegisterAttemptsWindow(now)
  if (registerAttemptsTimestamps.length >= REGISTER_RATE_LIMIT_MAX_ATTEMPTS) {
    return { status: 429, retry_after: getRateLimitRetryAfter(now) || 10 }
  }

  const errors: Record<string, string[]> = {}

  if (!payload.username?.trim()) errors.username = ['Este campo es obligatorio.']
  if (!payload.password) errors.password = ['Este campo es obligatorio.']
  if (!payload.password_confirm) errors.password_confirm = ['Este campo es obligatorio.']
  if (!payload.registration_code) errors.registration_code = ['Este campo es obligatorio.']

  if (
    payload.password &&
    payload.password_confirm &&
    payload.password !== payload.password_confirm
  ) {
    errors.password_confirm = ['Las contraseñas no coinciden.']
  }

  ensureRegistrationCodeValidity()
  if (payload.registration_code && payload.registration_code !== registrationCodeState.code) {
    errors.registration_code = ['Código de registro inválido.']
  }

  if (
    users.some((candidate) => candidate.username.toLowerCase() === payload.username.toLowerCase())
  ) {
    errors.username = ['No se pudo completar el registro con ese usuario.']
  }

  if (Object.keys(errors).length > 0) {
    bumpRegisterAttempts(now)
    return { status: 400, errors }
  }

  registerAttemptsTimestamps = []

  const user: MockUserRecord = {
    id: nextUserId++,
    username: payload.username.trim(),
    email: payload.email?.trim() ?? '',
    first_name: payload.first_name?.trim() ?? '',
    last_name: payload.last_name?.trim() ?? '',
    is_staff: false,
    role: 'student',
    course_id: null,
    date_joined: new Date().toISOString(),
    password: payload.password,
  }

  users.push(user)
  return { status: 201, user: toPublicUser(user) }
}

export function authenticate(
  username: string,
  password: string
): { access: string; refresh: string } | null {
  const user = users.find(
    (candidate) => candidate.username === username && candidate.password === password
  )
  if (!user) return null

  const publicUser = toPublicUser(user)
  const refresh = makeRefreshToken(publicUser)
  sessionsByRefreshToken.set(refresh, { username: publicUser.username, refresh })

  return {
    access: makeAccessToken(publicUser),
    refresh,
  }
}

export function refreshAccessToken(
  refreshToken: string
): { access: string; refresh: string } | null {
  const session = sessionsByRefreshToken.get(refreshToken)
  if (!session) return null

  const user = getUserByUsername(session.username)
  if (!user) return null

  sessionsByRefreshToken.delete(refreshToken)
  const newRefresh = makeRefreshToken(user)
  sessionsByRefreshToken.set(newRefresh, { username: user.username, refresh: newRefresh })

  return {
    access: makeAccessToken(user),
    refresh: newRefresh,
  }
}

function decodeBearerToken(request: Request): { username?: string } | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null

  const token = auth.slice('Bearer '.length)
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      username?: string
    }
    return payload
  } catch {
    return null
  }
}

export function getRequestUser(request: Request): User | null {
  const payload = decodeBearerToken(request)
  if (!payload?.username) return null
  return getUserByUsername(payload.username)
}

function isStudentAssignedToTeacher(studentUsername: string, teacherUsername: string): boolean {
  return courses.some(
    (course) =>
      course.teacher_username === teacherUsername &&
      course.student_usernames.includes(studentUsername)
  )
}

export function canAccessCompany(user: User, company: Company): boolean {
  return company.owner_username === user.username
}

export function listCompaniesForUser(user: User): Company[] {
  return companies.filter((company) => company.owner_username === user.username)
}

export function canReviewCompany(user: User, company: Company): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'teacher') {
    return isStudentAssignedToTeacher(company.owner_username, user.username)
  }
  return company.owner_username === user.username
}

export function listCompaniesForStudentAsTeacher(
  teacher: User,
  studentId: number
): Company[] | null {
  if (teacher.role !== 'teacher' && teacher.role !== 'admin') return null

  const student = users.find((user) => user.id === studentId)
  if (!student || student.role !== 'student') return null

  if (
    teacher.role === 'teacher' &&
    !isStudentAssignedToTeacher(student.username, teacher.username)
  ) {
    return null
  }

  return companies.filter((company) => company.owner_username === student.username)
}

export function getStudentUsernameForTeacher(teacher: User, studentId: number): string | null {
  if (teacher.role !== 'teacher' && teacher.role !== 'admin') return null

  const student = users.find((user) => user.id === studentId)
  if (!student || student.role !== 'student') return null

  if (
    teacher.role === 'teacher' &&
    !isStudentAssignedToTeacher(student.username, teacher.username)
  ) {
    return null
  }

  return student.username
}

export function createCompany(
  ownerUsername: string,
  payload: { name: string; tax_id?: string }
): Company {
  const now = new Date().toISOString()
  const newCompany: Company = {
    id: nextCompanyId++,
    name: payload.name,
    tax_id: payload.tax_id ?? null,
    owner_username: ownerUsername,
    account_count: 0,
    books_closed_until: null,
    created_at: now,
    updated_at: now,
  }
  companies.push(newCompany)
  return newCompany
}

export function updateCompany(
  companyId: number,
  payload: { name?: string; tax_id?: string | null }
): Company | null {
  const idx = companies.findIndex((company) => company.id === companyId)
  if (idx === -1) return null

  companies[idx] = {
    ...companies[idx],
    ...(payload.name !== undefined ? { name: payload.name } : null),
    ...(payload.tax_id !== undefined ? { tax_id: payload.tax_id } : null),
    updated_at: new Date().toISOString(),
  }

  return companies[idx]
}

export function deleteCompany(companyId: number): boolean {
  const idx = companies.findIndex((company) => company.id === companyId)
  if (idx === -1) return false
  companies.splice(idx, 1)
  return true
}

export function getCompanyById(companyId: number): Company | null {
  return companies.find((company) => company.id === companyId) ?? null
}

function toJournalList(entry: JournalEntryDetail): JournalEntry {
  const { lines: _lines, ...listEntry } = entry
  return listEntry
}

function resolveAccountName(accountId: number): { code: string; name: string } {
  const map: Record<number, { code: string; name: string }> = {
    301: { code: '1.01.01', name: 'Caja en Pesos' },
    302: { code: '1.01.02', name: 'Banco Nación Cta. Cte.' },
    303: { code: '5.02.01', name: 'Sueldos y Jornales' },
    310: { code: '1.01.01', name: 'Caja en Pesos' },
    311: { code: '4.01.01', name: 'Ventas al Contado' },
  }

  return map[accountId] ?? { code: String(accountId), name: `Cuenta ${accountId}` }
}

function summarize(lines: JournalLine[]): { totalDebit: number; totalCredit: number } {
  return lines.reduce(
    (acc, line) => {
      const amount = Number(line.amount)
      if (line.type === 'DEBIT') acc.totalDebit += amount
      if (line.type === 'CREDIT') acc.totalCredit += amount
      return acc
    },
    { totalDebit: 0, totalCredit: 0 }
  )
}

function normalizeLineType(value: string): JournalLineType {
  return value === 'CREDIT' ? 'CREDIT' : 'DEBIT'
}

export function listJournalEntriesByCompany(companyId: number): JournalEntry[] {
  return journalEntries
    .filter((entry) => journalCompanyMap[entry.id] === companyId)
    .sort((a, b) => a.entry_number - b.entry_number)
    .map(toJournalList)
}

export function listJournalEntryDetailsByCompany(companyId: number): JournalEntryDetail[] {
  return journalEntries
    .filter((entry) => journalCompanyMap[entry.id] === companyId)
    .sort((a, b) => a.entry_number - b.entry_number)
}

export function getJournalEntry(companyId: number, entryId: number): JournalEntryDetail | null {
  return (
    journalEntries.find(
      (entry) => journalCompanyMap[entry.id] === companyId && entry.id === entryId
    ) ?? null
  )
}

export function createJournalEntry(
  companyId: number,
  payload: CreateJournalEntryPayload,
  createdBy: string
): JournalEntryDetail | { error: string } {
  if (!payload.lines || payload.lines.length < 2) {
    return { error: 'Se requieren al menos 2 líneas.' }
  }

  const lines: JournalLine[] = payload.lines.map((line) => {
    const account = resolveAccountName(line.account_id)
    return {
      account_id: line.account_id,
      account_code: account.code,
      account_name: account.name,
      type: normalizeLineType(line.type),
      amount: line.amount,
    }
  })

  const { totalDebit, totalCredit } = summarize(lines)
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return { error: 'El asiento debe estar balanceado.' }
  }

  const maxEntryNumber = Math.max(
    0,
    ...journalEntries
      .filter((entry) => journalCompanyMap[entry.id] === companyId)
      .map((entry) => entry.entry_number)
  )

  const entry: JournalEntryDetail = {
    id: nextJournalId++,
    entry_number: maxEntryNumber + 1,
    date: payload.date,
    description: payload.description,
    source_type: 'MANUAL',
    source_ref: '',
    created_by: createdBy,
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: totalDebit,
    total_credit: totalCredit,
    lines,
  }

  journalEntries.push(entry)
  journalCompanyMap[entry.id] = companyId

  return entry
}

function canAccessCourse(user: User, course: Course): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'teacher') return course.teacher_username === user.username
  return false
}

function findAccessibleCourse(user: User, courseId: number): Course | null {
  const course = courses.find((candidate) => candidate.id === courseId)
  if (!course) return null
  if (!canAccessCourse(user, course)) return null
  return course
}

export function listCoursesForUser(user: User): Array<{
  id: number
  name: string
  code: string | null
  teacher_id: number
  teacher_username: string
  student_count: number
  created_at: string
  updated_at: string
}> {
  const visibleCourses = courses.filter((course) => canAccessCourse(user, course))

  return visibleCourses.map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    teacher_id: course.teacher_id,
    teacher_username: course.teacher_username,
    student_count: course.student_usernames.length,
    created_at: course.created_at,
    updated_at: course.updated_at,
  }))
}

export function createCourseForUser(
  user: User,
  payload: { name?: string; code?: string; teacher_id?: number }
):
  | {
      id: number
      name: string
      code: string | null
      teacher_id: number
      teacher_username: string
      student_count: number
      created_at: string
      updated_at: string
    }
  | { error: string; status: number } {
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return { error: 'Forbidden', status: 403 }
  }

  const name = payload.name?.trim()
  if (!name) {
    return { error: 'Validation error', status: 400 }
  }

  const teacherCandidate =
    user.role === 'admin' && payload.teacher_id
      ? users.find(
          (candidate) => candidate.id === payload.teacher_id && candidate.role === 'teacher'
        )
      : users.find((candidate) => candidate.username === user.username)

  if (!teacherCandidate) {
    return { error: 'Teacher not found', status: 400 }
  }

  const now = new Date().toISOString()
  const created: Course = {
    id: nextCourseId++,
    name,
    code: payload.code?.trim() || null,
    teacher_id: teacherCandidate.id,
    teacher_username: teacherCandidate.username,
    student_usernames: [],
    created_at: now,
    updated_at: now,
  }
  courses.push(created)

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    teacher_id: created.teacher_id,
    teacher_username: created.teacher_username,
    student_count: 0,
    created_at: created.created_at,
    updated_at: created.updated_at,
  }
}

export function listTeacherCourseCompanies(
  user: User,
  courseId: number
): {
  course_id: number
  course_name: string
  students: Array<{
    student_id: number
    student_username: string
    student_full_name: string
    companies: Array<{
      id: number
      name: string
      tax_id: string
      created_at: string
    }>
  }>
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  return {
    course_id: course.id,
    course_name: course.name,
    students: course.student_usernames
      .map((username) => users.find((candidate) => candidate.username === username))
      .filter((candidate): candidate is MockUserRecord => candidate !== undefined)
      .map((student) => ({
        student_id: student.id,
        student_username: student.username,
        student_full_name: `${student.first_name} ${student.last_name}`.trim(),
        companies: companies
          .filter((company) => company.owner_username === student.username)
          .map((company) => ({
            id: company.id,
            name: company.name,
            tax_id: company.tax_id ?? '',
            created_at: company.created_at,
          })),
      })),
  }
}

export function listTeacherCourseJournalEntries(
  user: User,
  courseId: number,
  filters: {
    student_id?: number
    company_id?: number
    date_from?: string
    date_to?: string
  }
): {
  count: number
  next: null
  previous: null
  results: Array<{
    id: number
    entry_number: number
    date: string
    description: string
    source_type: string
    source_ref: string
    company_id: number
    company_name: string
    student_id: number
    student_username: string
    created_by: string
    reversal_of_id: number
    reversed_by_id: number | null
    lines: JournalLine[]
  }>
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  const courseStudentSet = new Set(course.student_usernames)
  const allowedCompanies = companies
    .filter((company) => courseStudentSet.has(company.owner_username))
    .map((company) => company.id)

  let entries = journalEntries.filter((entry) =>
    allowedCompanies.includes(journalCompanyMap[entry.id])
  )

  if (filters.student_id) {
    const student = users.find((candidate) => candidate.id === filters.student_id)
    if (!student) {
      entries = []
    } else {
      entries = entries.filter((entry) => {
        const company = getCompanyById(journalCompanyMap[entry.id])
        return company?.owner_username === student.username
      })
    }
  }

  if (filters.company_id) {
    entries = entries.filter((entry) => journalCompanyMap[entry.id] === filters.company_id)
  }

  if (filters.date_from) {
    entries = entries.filter((entry) => entry.date >= filters.date_from!)
  }
  if (filters.date_to) {
    entries = entries.filter((entry) => entry.date <= filters.date_to!)
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.date === b.date) return a.entry_number - b.entry_number
    return a.date.localeCompare(b.date)
  })

  const results = sorted
    .map((entry) => {
      const companyId = journalCompanyMap[entry.id]
      const company = getCompanyById(companyId)
      if (!company) return null
      const student = users.find((candidate) => candidate.username === company.owner_username)
      if (!student) return null

      return {
        id: entry.id,
        entry_number: entry.entry_number,
        date: entry.date,
        description: entry.description,
        source_type: entry.source_type,
        source_ref: entry.source_ref,
        company_id: company.id,
        company_name: company.name,
        student_id: student.id,
        student_username: student.username,
        created_by: entry.created_by,
        reversal_of_id: entry.reversal_of_id ?? 0,
        reversed_by_id: entry.reversed_by_id ?? null,
        lines: entry.lines,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  }
}

export function listAvailableStudentsForCourse(
  user: User,
  courseId: number,
  filters: {
    search?: string
    page?: number
    pageSize?: number
  }
): {
  count: number
  next: string | null
  previous: string | null
  results: Array<{
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }>
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  const search = (filters.search ?? '').trim().toLowerCase()
  const pageSize = Math.max(1, filters.pageSize ?? 8)
  const page = Math.max(1, filters.page ?? 1)

  let available = users.filter(
    (candidate) =>
      candidate.role === 'student' &&
      (candidate.course_id === null || candidate.course_id === undefined) &&
      !course.student_usernames.includes(candidate.username)
  )

  if (search.length > 0) {
    available = available.filter((candidate) => {
      const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase()
      return candidate.username.toLowerCase().includes(search) || fullName.includes(search)
    })
  }

  const count = available.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paged = available.slice(start, end)

  return {
    count,
    next: end < count ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results: paged.map((student) => ({
      id: student.id,
      username: student.username,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
    })),
  }
}

export function enrollStudentInCourse(
  user: User,
  courseId: number,
  studentId: number
): { ok: true } | { ok: false; status: number; detail: string } {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return { ok: false, status: 403, detail: 'Forbidden' }

  const student = users.find((candidate) => candidate.id === studentId)
  if (!student || student.role !== 'student') {
    return { ok: false, status: 404, detail: 'Student not found' }
  }

  if (
    student.course_id !== null &&
    student.course_id !== undefined &&
    student.course_id !== course.id
  ) {
    return { ok: false, status: 400, detail: 'Student already enrolled in another course' }
  }

  if (!course.student_usernames.includes(student.username)) {
    course.student_usernames.push(student.username)
  }
  student.course_id = course.id
  course.updated_at = new Date().toISOString()

  return { ok: true }
}

export function unenrollStudentFromCourse(
  user: User,
  courseId: number,
  studentId: number
): { ok: true } | { ok: false; status: number; detail: string } {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return { ok: false, status: 403, detail: 'Forbidden' }

  const student = users.find((candidate) => candidate.id === studentId)
  if (!student || student.role !== 'student') {
    return { ok: false, status: 404, detail: 'Student not found' }
  }

  const idx = course.student_usernames.indexOf(student.username)
  if (idx === -1) {
    return { ok: false, status: 404, detail: 'Enrollment not found' }
  }
  course.student_usernames.splice(idx, 1)
  if (student.course_id === course.id) {
    student.course_id = null
  }
  course.updated_at = new Date().toISOString()

  return { ok: true }
}

export function buildTeacherDashboard(user: User): TeacherDashboardResponse | null {
  if (user.role !== 'teacher' && user.role !== 'admin') return null

  const teacherCourses =
    user.role === 'admin'
      ? courses
      : courses.filter((course) => course.teacher_username === user.username)

  return {
    courses: teacherCourses.map((course) => ({
      id: course.id,
      name: course.name,
      teacher_username: course.teacher_username,
      students_count: course.student_usernames.length,
      students: course.student_usernames
        .map((username) => users.find((candidate) => candidate.username === username))
        .filter((candidate): candidate is MockUserRecord => candidate !== undefined)
        .map((student) => {
          const studentCompanies = companies.filter(
            (company) => company.owner_username === student.username
          )
          const journalCount = journalEntries.filter((entry) => {
            const companyId = journalCompanyMap[entry.id]
            const company = getCompanyById(companyId)
            return company?.owner_username === student.username
          }).length

          return {
            id: student.id,
            username: student.username,
            full_name: `${student.first_name} ${student.last_name}`.trim(),
            course_id: course.id,
            course_name: course.name,
            company_count: studentCompanies.length,
            journal_entry_count: journalCount,
          }
        }),
    })),
  }
}

export function getAccountChartConfig(): AccountLevelConfig[] {
  return [...accountChartConfig]
}

export function patchAccountChartConfig(items: AccountLevelConfig[]): AccountLevelConfig[] {
  accountChartConfig = items.map((item) => ({ ...item }))
  return getAccountChartConfig()
}

export function patchSingleAccountVisibility(
  accountId: number,
  isVisible: boolean
): AccountLevelConfig | null {
  const idx = accountChartConfig.findIndex((item) => item.account_id === accountId)
  if (idx === -1) return null
  accountChartConfig[idx] = { ...accountChartConfig[idx], visible: isVisible }
  return { ...accountChartConfig[idx] }
}

export function updateUserRole(userId: number, role: Exclude<Role, 'admin'>): User | null {
  const idx = users.findIndex((user) => user.id === userId)
  if (idx === -1) return null
  if (users[idx].role === 'admin') return null

  users[idx] = {
    ...users[idx],
    role,
    is_staff: role !== 'student',
  }

  return toPublicUser(users[idx])
}
