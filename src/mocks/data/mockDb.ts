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
  teacher_username: string
  student_usernames: string[]
}

type Session = {
  username: string
  refresh: string
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
    password: 'password',
  },
]

const courses: Course[] = [
  {
    id: 1,
    name: 'Contabilidad I',
    teacher_username: 'teacher1',
    student_usernames: ['student1', 'student2'],
  },
]

let nextCompanyId = 5
const companies: Company[] = [
  {
    id: 1,
    name: 'Ferretería Los Andes',
    tax_id: '20-12345678-9',
    owner_username: 'student1',
    account_count: 3,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Librería del Centro',
    tax_id: null,
    owner_username: 'student1',
    account_count: 2,
    created_at: '2024-03-15T14:30:00Z',
    updated_at: '2024-03-15T14:30:00Z',
  },
  {
    id: 3,
    name: 'Panadería San Martín',
    tax_id: '27-98765432-1',
    owner_username: 'student2',
    account_count: 0,
    created_at: '2024-04-01T09:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
  {
    id: 4,
    name: 'Academia Central',
    tax_id: '30-77889966-3',
    owner_username: 'admin',
    account_count: 1,
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
    total_debit: totalDebit,
    total_credit: totalCredit,
    lines,
  }

  journalEntries.push(entry)
  journalCompanyMap[entry.id] = companyId

  return entry
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
