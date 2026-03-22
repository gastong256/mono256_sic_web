import type { Company, OpeningEntryPayload } from '@/features/companies/types/company.types'
import type {
  CurrentBookBalances,
  ClosingSnapshot,
  ClosingDraftEntry,
  ClosingState,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'
import type {
  LogicalExercise,
  LogicalExerciseListResponse,
} from '@/features/companies/types/logicalExercises.types'
import type {
  CreateJournalEntryPayload,
  JournalEntry,
  JournalEntryDetail,
  JournalLine,
  JournalLineType,
  ReverseJournalEntryPayload,
} from '@/features/journal/types/journal.types'
import type { AccountLevelConfig, Role, User } from '@/shared/types'
import { isNonReversibleJournalSourceType } from '@/features/journal/lib/sourceTypes'

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

type CourseDemoCompanyVisibility = {
  course_id: number
  company_id: number
  is_visible: boolean
}

type CourseSharedCompanyVisibility = {
  course_id: number
  company_id: number
  is_visible: boolean
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

const courseDemoCompanyVisibilities: CourseDemoCompanyVisibility[] = [
  { course_id: 1, company_id: 6, is_visible: false },
  { course_id: 1, company_id: 7, is_visible: true },
  { course_id: 2, company_id: 6, is_visible: false },
  { course_id: 2, company_id: 7, is_visible: false },
  { course_id: 3, company_id: 6, is_visible: false },
  { course_id: 3, company_id: 7, is_visible: false },
]

const courseSharedCompanyVisibilities: CourseSharedCompanyVisibility[] = [
  { course_id: 1, company_id: 33, is_visible: true },
]

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

let nextCompanyId = 8
const companies: Company[] = [
  {
    id: 1,
    name: 'Ferretería Los Andes',
    description: 'Empresa operativa con apertura registrada',
    tax_id: '20-12345678-9',
    owner_username: 'student1',
    account_count: 3,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: 1,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Librería del Centro',
    description: 'Empresa creada sin apertura',
    tax_id: null,
    owner_username: 'student1',
    account_count: 0,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: false,
    accounting_ready: false,
    opening_entry_id: null,
    created_at: '2024-03-15T14:30:00Z',
    updated_at: '2024-03-15T14:30:00Z',
  },
  {
    id: 3,
    name: 'Panadería San Martín',
    description: 'Empresa operativa',
    tax_id: '27-98765432-1',
    owner_username: 'student2',
    account_count: 0,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: 3,
    created_at: '2024-04-01T09:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
  {
    id: 4,
    name: 'Academia Central',
    description: 'Empresa del administrador',
    tax_id: '30-77889966-3',
    owner_username: 'admin',
    account_count: 1,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: null,
    created_at: '2024-04-20T09:00:00Z',
    updated_at: '2024-04-20T09:00:00Z',
  },
  {
    id: 5,
    name: 'Consultora Delta',
    description: 'Empresa operativa sin actividad posterior a la apertura',
    tax_id: '27-00112233-4',
    owner_username: 'student1',
    account_count: 1,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: null,
    created_at: '2024-04-25T09:00:00Z',
    updated_at: '2024-04-25T09:00:00Z',
  },
  {
    id: 6,
    name: 'Empresa Demo Guiada',
    description: 'Demo de solo lectura para explorar el sistema',
    tax_id: null,
    owner_username: 'student1',
    account_count: 2,
    books_closed_until: null,
    is_demo: true,
    is_read_only: true,
    is_published: false,
    demo_slug: 'empresa-demo-guiada',
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: null,
    created_at: '2024-04-28T09:00:00Z',
    updated_at: '2024-04-28T09:00:00Z',
  },
  {
    id: 33,
    name: 'Ferretería Aula Docente',
    description: 'Empresa propia del docente compartida con el curso',
    tax_id: '30-11111111-9',
    owner_username: 'teacher1',
    account_count: 1,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: true,
    accounting_ready: true,
    opening_entry_id: null,
    created_at: '2024-04-29T09:00:00Z',
    updated_at: '2024-04-29T09:00:00Z',
  },
]

let nextJournalId = 20
const journalEntries: JournalEntryDetail[] = [
  {
    id: 1,
    entry_number: 1,
    date: '2024-03-01',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
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

let nextSyntheticAccountId = 900
let nextClosingSnapshotId = 1
const syntheticAccounts: Record<number, { code: string; name: string }> = {
  301: { code: '1.01.01', name: 'Caja en Pesos' },
  302: { code: '1.01.02', name: 'Banco Nación Cta. Cte.' },
  303: { code: '5.02.01', name: 'Sueldos y Jornales' },
  310: { code: '1.01.01', name: 'Caja en Pesos' },
  311: { code: '4.01.01', name: 'Ventas al Contado' },
}

const closingSnapshots: ClosingSnapshot[] = []

let accountChartConfig: AccountLevelConfig[] = [
  { account_id: 1, level: 0, code: '1', name: 'Activo', visible: true },
  { account_id: 2, level: 0, code: '2', name: 'Pasivo', visible: true },
  { account_id: 3, level: 0, code: '3', name: 'Patrimonio Neto', visible: true },
  { account_id: 4, level: 0, code: '4', name: 'Ingresos', visible: true },
  { account_id: 5, level: 0, code: '5', name: 'Egresos', visible: true },
  { account_id: 11, level: 1, code: '1.01', name: 'Caja y Bancos', visible: true },
  { account_id: 12, level: 1, code: '1.02', name: 'Créditos', visible: true },
  { account_id: 13, level: 1, code: '1.03', name: 'Bienes de Cambio', visible: true },
  { account_id: 14, level: 1, code: '1.04', name: 'Bienes de Uso', visible: true },
  { account_id: 21, level: 1, code: '2.01', name: 'Deudas Comerciales', visible: true },
  { account_id: 22, level: 1, code: '2.02', name: 'Deudas Bancarias', visible: true },
  { account_id: 23, level: 1, code: '2.03', name: 'Deudas Fiscales', visible: true },
  { account_id: 31, level: 1, code: '3.01', name: 'Capital', visible: true },
  { account_id: 32, level: 1, code: '3.02', name: 'Resultados', visible: true },
  { account_id: 41, level: 1, code: '4.01', name: 'Ventas', visible: true },
  { account_id: 42, level: 1, code: '4.02', name: 'Otros Ingresos', visible: true },
  { account_id: 51, level: 1, code: '5.01', name: 'Costo de Ventas', visible: true },
  { account_id: 52, level: 1, code: '5.02', name: 'Gastos Operativos', visible: true },
  { account_id: 53, level: 1, code: '5.03', name: 'Gastos Financieros', visible: true },
]

function pushJournalEntry(companyId: number, entry: JournalEntryDetail) {
  journalEntries.push(entry)
  journalCompanyMap[entry.id] = companyId
}

function seedExpandedMockDataset() {
  const extraUsers: MockUserRecord[] = [
    {
      id: 6,
      username: 'teacher2',
      email: 'teacher2@example.com',
      first_name: 'Marina',
      last_name: 'Teacher',
      is_staff: true,
      role: 'teacher',
      course_id: null,
      date_joined: '2024-02-08T09:30:00Z',
      password: 'password',
    },
    {
      id: 7,
      username: 'student4',
      email: 'student4@example.com',
      first_name: 'Micaela',
      last_name: 'Pérez',
      is_staff: false,
      role: 'student',
      course_id: 2,
      date_joined: '2024-02-06T09:30:00Z',
      password: 'password',
    },
    {
      id: 8,
      username: 'student5',
      email: 'student5@example.com',
      first_name: 'Bruno',
      last_name: 'Ramos',
      is_staff: false,
      role: 'student',
      course_id: 2,
      date_joined: '2024-02-07T09:30:00Z',
      password: 'password',
    },
    {
      id: 9,
      username: 'student6',
      email: 'student6@example.com',
      first_name: 'Carla',
      last_name: 'Vega',
      is_staff: false,
      role: 'student',
      course_id: 3,
      date_joined: '2024-02-09T09:30:00Z',
      password: 'password',
    },
    {
      id: 10,
      username: 'student7',
      email: 'student7@example.com',
      first_name: 'Diego',
      last_name: 'Núñez',
      is_staff: false,
      role: 'student',
      course_id: 3,
      date_joined: '2024-02-10T09:30:00Z',
      password: 'password',
    },
  ]

  const extraSelectableStudents: MockUserRecord[] = Array.from({ length: 20 }, (_, index) => {
    const id = 11 + index
    return {
      id,
      username: `student${id}`,
      email: `student${id}@example.com`,
      first_name: `Alumno ${String(index + 1).padStart(2, '0')}`,
      last_name: 'Libre',
      is_staff: false,
      role: 'student',
      course_id: null,
      date_joined: `2024-03-${String(index + 1).padStart(2, '0')}T09:30:00Z`,
      password: 'password',
    }
  })

  users.push(...extraUsers, ...extraSelectableStudents)

  const student3 = users.find((user) => user.username === 'student3')
  if (student3) {
    student3.course_id = 2
  }

  courses.push(
    {
      id: 2,
      name: 'Contabilidad II',
      code: 'CONT-II',
      teacher_id: 2,
      teacher_username: 'teacher1',
      student_usernames: ['student3', 'student4', 'student5'],
      created_at: '2024-02-12T08:00:00Z',
      updated_at: '2024-02-12T08:00:00Z',
    },
    {
      id: 3,
      name: 'Cierres y Ajustes',
      code: 'CIERRE-2024',
      teacher_id: 6,
      teacher_username: 'teacher2',
      student_usernames: ['student6', 'student7'],
      created_at: '2024-02-18T08:00:00Z',
      updated_at: '2024-02-18T08:00:00Z',
    }
  )

  companies.push(
    {
      id: 7,
      name: 'Demo Comercial Publicada',
      description: 'Empresa demo visible para revisar estados de solo lectura',
      tax_id: null,
      owner_username: 'student1',
      account_count: 3,
      books_closed_until: null,
      is_demo: true,
      is_read_only: true,
      is_published: true,
      demo_slug: 'demo-comercial-publicada',
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 17,
      created_at: '2024-05-02T09:00:00Z',
      updated_at: '2024-05-02T09:00:00Z',
    },
    {
      id: 8,
      name: 'Clinica Modelo',
      description: 'Empresa con libros cerrados y acceso solo lectura',
      tax_id: '30-44556677-1',
      owner_username: 'student2',
      account_count: 3,
      books_closed_until: '2025-12-31',
      is_demo: false,
      is_read_only: true,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 19,
      created_at: '2024-05-03T09:00:00Z',
      updated_at: '2025-12-31T18:00:00Z',
    },
    {
      id: 9,
      name: 'Distribuidora Norte',
      description: 'Empresa operativa con varios movimientos',
      tax_id: '30-99887766-1',
      owner_username: 'student1',
      account_count: 4,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 21,
      created_at: '2024-05-04T09:00:00Z',
      updated_at: '2024-10-10T12:00:00Z',
    },
    {
      id: 10,
      name: 'Estudio Atlas',
      description: 'Empresa de servicios del segundo curso',
      tax_id: '27-55443322-5',
      owner_username: 'student3',
      account_count: 3,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 23,
      created_at: '2024-05-05T09:00:00Z',
      updated_at: '2024-11-14T12:00:00Z',
    },
    {
      id: 11,
      name: 'Hotel Costero',
      description: 'Empresa operativa con actividad sostenida',
      tax_id: '30-55667788-3',
      owner_username: 'student4',
      account_count: 3,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 25,
      created_at: '2024-05-06T09:00:00Z',
      updated_at: '2024-11-20T12:00:00Z',
    },
    {
      id: 12,
      name: 'Transporte Rio',
      description: 'Empresa pendiente de apertura del segundo curso',
      tax_id: '30-66778899-4',
      owner_username: 'student5',
      account_count: 0,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: false,
      accounting_ready: false,
      opening_entry_id: null,
      created_at: '2024-05-07T09:00:00Z',
      updated_at: '2024-05-07T09:00:00Z',
    },
    {
      id: 13,
      name: 'Vivero Central',
      description: 'Empresa operativa del curso de cierres',
      tax_id: '30-11223344-9',
      owner_username: 'student6',
      account_count: 3,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 27,
      created_at: '2024-05-08T09:00:00Z',
      updated_at: '2024-12-01T12:00:00Z',
    },
    {
      id: 14,
      name: 'Laboratorio Sur',
      description: 'Empresa con actividad historica del curso de cierres',
      tax_id: '30-22334455-8',
      owner_username: 'student7',
      account_count: 3,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: true,
      accounting_ready: true,
      opening_entry_id: 29,
      created_at: '2024-05-09T09:00:00Z',
      updated_at: '2025-01-15T12:00:00Z',
    }
  )

  const fillerOwners = [
    'student1',
    'student2',
    'student3',
    'student4',
    'student5',
    'student6',
    'student7',
    'admin',
  ]

  Array.from({ length: 18 }, (_, index) => {
    const id = 15 + index
    const owner = fillerOwners[index % fillerOwners.length]
    const hasOpening = index % 3 !== 0
    companies.push({
      id,
      name: `Empresa Mock ${String(index + 1).padStart(2, '0')}`,
      description:
        index % 2 === 0
          ? 'Escenario adicional para tablas, selectores y paginacion'
          : 'Empresa semilla para ampliar diversidad visual en MSW',
      tax_id: null,
      owner_username: owner,
      account_count: hasOpening ? 2 + (index % 3) : 0,
      books_closed_until: null,
      is_demo: false,
      is_read_only: false,
      is_published: false,
      demo_slug: null,
      has_opening_entry: hasOpening,
      accounting_ready: hasOpening,
      opening_entry_id: null,
      created_at: `2024-06-${String((index % 20) + 1).padStart(2, '0')}T09:00:00Z`,
      updated_at: `2024-06-${String((index % 20) + 1).padStart(2, '0')}T09:00:00Z`,
    })
  })

  Object.assign(syntheticAccounts, {
    304: { code: '1.03.01', name: 'Mercaderias' },
    305: { code: '2.01.01', name: 'Proveedores' },
    306: { code: '4.01.01', name: 'Ventas al Contado' },
    307: { code: '1.01.03', name: 'Banco Galicia Cta. Cte.' },
    308: { code: '3.02.01', name: 'Resultado del Ejercicio' },
    309: { code: '3.01.01', name: 'Capital Social' },
    340: { code: '1.01.01', name: 'Caja Demo Publicada' },
    341: { code: '3.01.01', name: 'Capital Demo' },
    342: { code: '4.01.01', name: 'Ventas Demo' },
    350: { code: '1.01.01', name: 'Caja Clinica' },
    351: { code: '3.01.01', name: 'Capital Clinica' },
    352: { code: '5.02.02', name: 'Honorarios Medicos' },
    360: { code: '1.01.01', name: 'Caja Distribuidora' },
    361: { code: '3.01.01', name: 'Capital Distribuidora' },
    362: { code: '4.01.01', name: 'Ventas Mayoristas' },
    363: { code: '1.03.01', name: 'Mercaderias Distribuidora' },
    370: { code: '1.01.01', name: 'Caja Estudio' },
    371: { code: '3.01.01', name: 'Capital Estudio' },
    372: { code: '4.02.01', name: 'Honorarios Profesionales' },
    380: { code: '1.01.01', name: 'Caja Hotel' },
    381: { code: '3.01.01', name: 'Capital Hotel' },
    382: { code: '4.01.02', name: 'Ingresos por Hospedaje' },
    390: { code: '1.01.01', name: 'Caja Vivero' },
    391: { code: '3.01.01', name: 'Capital Vivero' },
    392: { code: '4.01.03', name: 'Ventas de Plantines' },
    393: { code: '5.01.01', name: 'Costo de Mercaderia Vendida' },
    400: { code: '1.01.01', name: 'Caja Laboratorio' },
    401: { code: '3.01.01', name: 'Capital Laboratorio' },
    402: { code: '4.02.02', name: 'Servicios de Analisis' },
  })

  pushJournalEntry(1, {
    id: 4,
    entry_number: 3,
    date: '2024-06-12',
    description: 'Venta contado temporada invierno',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 45000,
    total_credit: 45000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '45000.00',
      },
      {
        account_id: 306,
        account_code: '4.01.01',
        account_name: 'Ventas al Contado',
        type: 'CREDIT',
        amount: '45000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 5,
    entry_number: 4,
    date: '2024-09-03',
    description: 'Compra de mercaderias a credito',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 18000,
    total_credit: 18000,
    lines: [
      {
        account_id: 304,
        account_code: '1.03.01',
        account_name: 'Mercaderias',
        type: 'DEBIT',
        amount: '18000.00',
      },
      {
        account_id: 305,
        account_code: '2.01.01',
        account_name: 'Proveedores',
        type: 'CREDIT',
        amount: '18000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 6,
    entry_number: 5,
    date: '2024-12-31',
    description: 'Por cierre de cuentas de Resultado Positivo (Ganancias)',
    source_type: 'RESULT_CLOSING',
    source_ref: 'CLOSING-RP',
    created_by: 'student1',
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: 45000,
    total_credit: 45000,
    lines: [
      {
        account_id: 306,
        account_code: '4.01.01',
        account_name: 'Ventas al Contado',
        type: 'DEBIT',
        amount: '45000.00',
      },
      {
        account_id: 308,
        account_code: '3.02.01',
        account_name: 'Resultado del Ejercicio',
        type: 'CREDIT',
        amount: '45000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 7,
    entry_number: 6,
    date: '2024-12-31',
    description: 'Por cierre de Cuentas Patrimoniales',
    source_type: 'PATRIMONIAL_CLOSING',
    source_ref: 'CLOSING-PATRIMONIAL',
    created_by: 'student1',
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: 50000,
    total_credit: 50000,
    lines: [
      {
        account_id: 309,
        account_code: '3.01.01',
        account_name: 'Capital Social',
        type: 'DEBIT',
        amount: '50000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '50000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 8,
    entry_number: 7,
    date: '2025-01-01',
    description: 'Por apertura de Cuentas Patrimoniales',
    source_type: 'REOPENING',
    source_ref: 'REOPENING-PATRIMONIAL',
    created_by: 'student1',
    reversal_of_id: null,
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
        account_id: 309,
        account_code: '3.01.01',
        account_name: 'Capital Social',
        type: 'CREDIT',
        amount: '50000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 9,
    entry_number: 8,
    date: '2025-02-14',
    description: 'Venta mostrador',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 78000,
    total_credit: 78000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '78000.00',
      },
      {
        account_id: 306,
        account_code: '4.01.01',
        account_name: 'Ventas al Contado',
        type: 'CREDIT',
        amount: '78000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 10,
    entry_number: 9,
    date: '2025-05-10',
    description: 'Deposito bancario',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 25000,
    total_credit: 25000,
    lines: [
      {
        account_id: 307,
        account_code: '1.01.03',
        account_name: 'Banco Galicia Cta. Cte.',
        type: 'DEBIT',
        amount: '25000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '25000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 11,
    entry_number: 10,
    date: '2025-11-20',
    description: 'Pago parcial a proveedor',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 12000,
    total_credit: 12000,
    lines: [
      {
        account_id: 305,
        account_code: '2.01.01',
        account_name: 'Proveedores',
        type: 'DEBIT',
        amount: '12000.00',
      },
      {
        account_id: 307,
        account_code: '1.01.03',
        account_name: 'Banco Galicia Cta. Cte.',
        type: 'CREDIT',
        amount: '12000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 12,
    entry_number: 11,
    date: '2025-12-31',
    description: 'Por cierre de cuentas de Resultado Positivo (Ganancias)',
    source_type: 'RESULT_CLOSING',
    source_ref: 'CLOSING-RP',
    created_by: 'student1',
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: 78000,
    total_credit: 78000,
    lines: [
      {
        account_id: 306,
        account_code: '4.01.01',
        account_name: 'Ventas al Contado',
        type: 'DEBIT',
        amount: '78000.00',
      },
      {
        account_id: 308,
        account_code: '3.02.01',
        account_name: 'Resultado del Ejercicio',
        type: 'CREDIT',
        amount: '78000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 13,
    entry_number: 12,
    date: '2025-12-31',
    description: 'Por cierre de Cuentas Patrimoniales',
    source_type: 'PATRIMONIAL_CLOSING',
    source_ref: 'CLOSING-PATRIMONIAL',
    created_by: 'student1',
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: 90000,
    total_credit: 90000,
    lines: [
      {
        account_id: 309,
        account_code: '3.01.01',
        account_name: 'Capital Social',
        type: 'DEBIT',
        amount: '90000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '40000.00',
      },
      {
        account_id: 304,
        account_code: '1.03.01',
        account_name: 'Mercaderias',
        type: 'CREDIT',
        amount: '20000.00',
      },
      {
        account_id: 307,
        account_code: '1.01.03',
        account_name: 'Banco Galicia Cta. Cte.',
        type: 'CREDIT',
        amount: '30000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 14,
    entry_number: 13,
    date: '2026-01-01',
    description: 'Por apertura de Cuentas Patrimoniales',
    source_type: 'REOPENING',
    source_ref: 'REOPENING-PATRIMONIAL',
    created_by: 'student1',
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: 90000,
    total_credit: 90000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '40000.00',
      },
      {
        account_id: 304,
        account_code: '1.03.01',
        account_name: 'Mercaderias',
        type: 'DEBIT',
        amount: '20000.00',
      },
      {
        account_id: 307,
        account_code: '1.01.03',
        account_name: 'Banco Galicia Cta. Cte.',
        type: 'DEBIT',
        amount: '30000.00',
      },
      {
        account_id: 309,
        account_code: '3.01.01',
        account_name: 'Capital Social',
        type: 'CREDIT',
        amount: '90000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 15,
    entry_number: 14,
    date: '2026-01-15',
    description: 'Cobranza de mostrador',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 92000,
    total_credit: 92000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '92000.00',
      },
      {
        account_id: 306,
        account_code: '4.01.01',
        account_name: 'Ventas al Contado',
        type: 'CREDIT',
        amount: '92000.00',
      },
    ],
  })
  pushJournalEntry(1, {
    id: 16,
    entry_number: 15,
    date: '2026-02-20',
    description: 'Pago a proveedor local',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 10000,
    total_credit: 10000,
    lines: [
      {
        account_id: 305,
        account_code: '2.01.01',
        account_name: 'Proveedores',
        type: 'DEBIT',
        amount: '10000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '10000.00',
      },
    ],
  })
  pushJournalEntry(7, {
    id: 17,
    entry_number: 1,
    date: '2025-01-01',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 15000,
    total_credit: 15000,
    lines: [
      {
        account_id: 340,
        account_code: '1.01.01',
        account_name: 'Caja Demo Publicada',
        type: 'DEBIT',
        amount: '15000.00',
      },
      {
        account_id: 341,
        account_code: '3.01.01',
        account_name: 'Capital Demo',
        type: 'CREDIT',
        amount: '15000.00',
      },
    ],
  })
  pushJournalEntry(7, {
    id: 18,
    entry_number: 2,
    date: '2025-01-10',
    description: 'Venta guiada demo',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 9000,
    total_credit: 9000,
    lines: [
      {
        account_id: 340,
        account_code: '1.01.01',
        account_name: 'Caja Demo Publicada',
        type: 'DEBIT',
        amount: '9000.00',
      },
      {
        account_id: 342,
        account_code: '4.01.01',
        account_name: 'Ventas Demo',
        type: 'CREDIT',
        amount: '9000.00',
      },
    ],
  })
  pushJournalEntry(8, {
    id: 19,
    entry_number: 1,
    date: '2025-01-01',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student2',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 22000,
    total_credit: 22000,
    lines: [
      {
        account_id: 350,
        account_code: '1.01.01',
        account_name: 'Caja Clinica',
        type: 'DEBIT',
        amount: '22000.00',
      },
      {
        account_id: 351,
        account_code: '3.01.01',
        account_name: 'Capital Clinica',
        type: 'CREDIT',
        amount: '22000.00',
      },
    ],
  })
  pushJournalEntry(8, {
    id: 20,
    entry_number: 2,
    date: '2025-04-17',
    description: 'Pago de honorarios medicos',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student2',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 8000,
    total_credit: 8000,
    lines: [
      {
        account_id: 352,
        account_code: '5.02.02',
        account_name: 'Honorarios Medicos',
        type: 'DEBIT',
        amount: '8000.00',
      },
      {
        account_id: 350,
        account_code: '1.01.01',
        account_name: 'Caja Clinica',
        type: 'CREDIT',
        amount: '8000.00',
      },
    ],
  })
  pushJournalEntry(9, {
    id: 21,
    entry_number: 1,
    date: '2024-05-04',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 36000,
    total_credit: 36000,
    lines: [
      {
        account_id: 360,
        account_code: '1.01.01',
        account_name: 'Caja Distribuidora',
        type: 'DEBIT',
        amount: '36000.00',
      },
      {
        account_id: 361,
        account_code: '3.01.01',
        account_name: 'Capital Distribuidora',
        type: 'CREDIT',
        amount: '36000.00',
      },
    ],
  })
  pushJournalEntry(9, {
    id: 22,
    entry_number: 2,
    date: '2024-10-10',
    description: 'Venta mayorista',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student1',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 27000,
    total_credit: 27000,
    lines: [
      {
        account_id: 360,
        account_code: '1.01.01',
        account_name: 'Caja Distribuidora',
        type: 'DEBIT',
        amount: '27000.00',
      },
      {
        account_id: 362,
        account_code: '4.01.01',
        account_name: 'Ventas Mayoristas',
        type: 'CREDIT',
        amount: '27000.00',
      },
    ],
  })
  pushJournalEntry(10, {
    id: 23,
    entry_number: 1,
    date: '2024-05-05',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student3',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 18000,
    total_credit: 18000,
    lines: [
      {
        account_id: 370,
        account_code: '1.01.01',
        account_name: 'Caja Estudio',
        type: 'DEBIT',
        amount: '18000.00',
      },
      {
        account_id: 371,
        account_code: '3.01.01',
        account_name: 'Capital Estudio',
        type: 'CREDIT',
        amount: '18000.00',
      },
    ],
  })
  pushJournalEntry(10, {
    id: 24,
    entry_number: 2,
    date: '2024-11-14',
    description: 'Honorarios por asesoramiento',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student3',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 14000,
    total_credit: 14000,
    lines: [
      {
        account_id: 370,
        account_code: '1.01.01',
        account_name: 'Caja Estudio',
        type: 'DEBIT',
        amount: '14000.00',
      },
      {
        account_id: 372,
        account_code: '4.02.01',
        account_name: 'Honorarios Profesionales',
        type: 'CREDIT',
        amount: '14000.00',
      },
    ],
  })
  pushJournalEntry(11, {
    id: 25,
    entry_number: 1,
    date: '2024-05-06',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student4',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 28000,
    total_credit: 28000,
    lines: [
      {
        account_id: 380,
        account_code: '1.01.01',
        account_name: 'Caja Hotel',
        type: 'DEBIT',
        amount: '28000.00',
      },
      {
        account_id: 381,
        account_code: '3.01.01',
        account_name: 'Capital Hotel',
        type: 'CREDIT',
        amount: '28000.00',
      },
    ],
  })
  pushJournalEntry(11, {
    id: 26,
    entry_number: 2,
    date: '2024-11-20',
    description: 'Ingreso por hospedaje',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student4',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 21000,
    total_credit: 21000,
    lines: [
      {
        account_id: 380,
        account_code: '1.01.01',
        account_name: 'Caja Hotel',
        type: 'DEBIT',
        amount: '21000.00',
      },
      {
        account_id: 382,
        account_code: '4.01.02',
        account_name: 'Ingresos por Hospedaje',
        type: 'CREDIT',
        amount: '21000.00',
      },
    ],
  })
  pushJournalEntry(13, {
    id: 27,
    entry_number: 1,
    date: '2024-05-08',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student6',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 24000,
    total_credit: 24000,
    lines: [
      {
        account_id: 390,
        account_code: '1.01.01',
        account_name: 'Caja Vivero',
        type: 'DEBIT',
        amount: '24000.00',
      },
      {
        account_id: 391,
        account_code: '3.01.01',
        account_name: 'Capital Vivero',
        type: 'CREDIT',
        amount: '24000.00',
      },
    ],
  })
  pushJournalEntry(13, {
    id: 28,
    entry_number: 2,
    date: '2024-12-01',
    description: 'Venta de plantines',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student6',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 12500,
    total_credit: 12500,
    lines: [
      {
        account_id: 390,
        account_code: '1.01.01',
        account_name: 'Caja Vivero',
        type: 'DEBIT',
        amount: '12500.00',
      },
      {
        account_id: 392,
        account_code: '4.01.03',
        account_name: 'Ventas de Plantines',
        type: 'CREDIT',
        amount: '12500.00',
      },
    ],
  })
  pushJournalEntry(14, {
    id: 29,
    entry_number: 1,
    date: '2024-05-09',
    description: 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: '',
    created_by: 'student7',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 32000,
    total_credit: 32000,
    lines: [
      {
        account_id: 400,
        account_code: '1.01.01',
        account_name: 'Caja Laboratorio',
        type: 'DEBIT',
        amount: '32000.00',
      },
      {
        account_id: 401,
        account_code: '3.01.01',
        account_name: 'Capital Laboratorio',
        type: 'CREDIT',
        amount: '32000.00',
      },
    ],
  })
  pushJournalEntry(14, {
    id: 30,
    entry_number: 2,
    date: '2025-01-15',
    description: 'Servicios de analisis clinicos',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'student7',
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: 16500,
    total_credit: 16500,
    lines: [
      {
        account_id: 400,
        account_code: '1.01.01',
        account_name: 'Caja Laboratorio',
        type: 'DEBIT',
        amount: '16500.00',
      },
      {
        account_id: 402,
        account_code: '4.02.02',
        account_name: 'Servicios de Analisis',
        type: 'CREDIT',
        amount: '16500.00',
      },
    ],
  })

  closingSnapshots.push(
    {
      id: 1,
      company_id: 1,
      company: 'Ferretería Los Andes',
      patrimonial_closing_entry_id: 7,
      reopening_entry_id: 8,
      closing_date: '2024-12-31',
      reopening_date: '2025-01-01',
      balance_sheet: {
        date: '2024-12-31',
        assets: { groups: [], total: '68000.00' },
        liabilities: { groups: [], total: '18000.00' },
        equity: {
          groups: [],
          derived_result: {
            name: 'Resultado del Ejercicio',
            amount: '45000.00',
            kind: null,
          },
          total: '50000.00',
        },
        equation: {
          total_assets: '68000.00',
          total_liabilities_plus_equity: '68000.00',
          is_balanced: true,
        },
      },
      income_statement: {
        date: '2024-12-31',
        positive_results: { accounts: [], total: '45000.00' },
        negative_results: { accounts: [], total: '120000.00' },
        net_result: { amount: '75000.00', kind: 'loss' },
      },
      lines: [
        {
          account_id: 301,
          account_code: '1.01.01',
          account_name: 'Caja en Pesos',
          account_type: 'AS',
          root_code: '1',
          parent_code: '1.01',
          debit_balance: '95000.00',
          credit_balance: '0.00',
        },
      ],
    },
    {
      id: 2,
      company_id: 1,
      company: 'Ferretería Los Andes',
      patrimonial_closing_entry_id: 13,
      reopening_entry_id: 14,
      closing_date: '2025-12-31',
      reopening_date: '2026-01-01',
      balance_sheet: {
        date: '2025-12-31',
        assets: { groups: [], total: '90000.00' },
        liabilities: { groups: [], total: '6000.00' },
        equity: {
          groups: [],
          derived_result: {
            name: 'Resultado del Ejercicio',
            amount: '78000.00',
            kind: null,
          },
          total: '84000.00',
        },
        equation: {
          total_assets: '90000.00',
          total_liabilities_plus_equity: '90000.00',
          is_balanced: true,
        },
      },
      income_statement: {
        date: '2025-12-31',
        positive_results: { accounts: [], total: '78000.00' },
        negative_results: { accounts: [], total: '12000.00' },
        net_result: { amount: '66000.00', kind: 'gain' },
      },
      lines: [
        {
          account_id: 307,
          account_code: '1.01.03',
          account_name: 'Banco Galicia Cta. Cte.',
          account_type: 'AS',
          root_code: '1',
          parent_code: '1.01',
          debit_balance: '43000.00',
          credit_balance: '0.00',
        },
      ],
    }
  )

  nextUserId = Math.max(nextUserId, 31)
  nextCourseId = Math.max(nextCourseId, 4)
  nextCompanyId = Math.max(nextCompanyId, 34)
  nextJournalId = Math.max(nextJournalId, 31)
  nextSyntheticAccountId = Math.max(nextSyntheticAccountId, 403)
  nextClosingSnapshotId = Math.max(nextClosingSnapshotId, 3)
}

seedExpandedMockDataset()

const sessionsByRefreshToken = new Map<string, Session>()

const initialUsers = structuredClone(users)
const initialCourses = structuredClone(courses)
const initialCourseDemoCompanyVisibilities = structuredClone(courseDemoCompanyVisibilities)
const initialCourseSharedCompanyVisibilities = structuredClone(courseSharedCompanyVisibilities)
const initialCompanies = structuredClone(companies)
const initialJournalEntries = structuredClone(journalEntries)
const initialJournalCompanyMap = structuredClone(journalCompanyMap)
const initialSyntheticAccounts = structuredClone(syntheticAccounts)
const initialClosingSnapshots = structuredClone(closingSnapshots)
const initialAccountChartConfig = structuredClone(accountChartConfig)
const initialRegistrationCodeState = structuredClone(registrationCodeState)
const initialCounters = {
  nextCourseId,
  nextUserId,
  nextCompanyId,
  nextJournalId,
  nextSyntheticAccountId,
  nextClosingSnapshotId,
}

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

export function updateUserProfile(
  username: string,
  payload: { email?: string; first_name?: string; last_name?: string }
): User | null {
  const idx = users.findIndex((candidate) => candidate.username === username)
  if (idx === -1) return null

  users[idx] = {
    ...users[idx],
    ...(payload.email !== undefined ? { email: payload.email } : null),
    ...(payload.first_name !== undefined ? { first_name: payload.first_name } : null),
    ...(payload.last_name !== undefined ? { last_name: payload.last_name } : null),
  }

  return toPublicUser(users[idx])
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

function buildUserCapabilities(user: User) {
  return {
    can_manage_courses: user.role === 'teacher' || user.role === 'admin',
    can_manage_visibility: user.role === 'teacher' || user.role === 'admin',
    can_view_registration_code: user.role === 'teacher' || user.role === 'admin',
    can_manage_roles: user.role === 'admin',
  }
}

export function buildAuthMeResponse(
  user: User,
  include: Array<'companies' | 'capabilities' | 'registration_code'>
): User {
  return {
    ...user,
    ...(include.includes('companies')
      ? {
          companies: listCompaniesForUser(user).map((company) => ({
            id: company.id,
            name: company.name,
            owner_username: company.owner_username,
            books_closed_until: company.books_closed_until ?? null,
            is_demo: company.is_demo ?? false,
            is_read_only: company.is_read_only ?? false,
            viewer_can_write:
              typeof company.viewer_can_write === 'boolean' ? company.viewer_can_write : true,
            is_published: company.is_published ?? false,
            demo_slug: company.demo_slug ?? null,
            has_opening_entry: company.has_opening_entry ?? false,
            accounting_ready: company.accounting_ready ?? false,
            opening_entry_id: company.opening_entry_id ?? null,
          })),
        }
      : null),
    ...(include.includes('capabilities')
      ? {
          capabilities: buildUserCapabilities(user),
        }
      : null),
    ...(include.includes('registration_code')
      ? {
          registration_code:
            user.role === 'teacher' || user.role === 'admin' ? getRegistrationCode() : null,
        }
      : null),
  }
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

function getDemoVisibilityForCourse(courseId: number, companyId: number): boolean {
  return (
    courseDemoCompanyVisibilities.find(
      (visibility) => visibility.course_id === courseId && visibility.company_id === companyId
    )?.is_visible ?? false
  )
}

function getSharedVisibilityForCourse(courseId: number, companyId: number): boolean {
  return (
    courseSharedCompanyVisibilities.find(
      (visibility) => visibility.course_id === courseId && visibility.company_id === companyId
    )?.is_visible ?? false
  )
}

function isDemoVisibleForStudentCourse(
  company: Company,
  studentLike: Pick<User, 'role' | 'course_id'>
): boolean {
  if (studentLike.role !== 'student') return false
  if (company.is_demo !== true || company.is_published !== true) return false
  if (!studentLike.course_id) return false
  return getDemoVisibilityForCourse(studentLike.course_id, company.id)
}

function isSharedCompanyVisibleForStudentCourse(
  company: Company,
  studentLike: Pick<User, 'role' | 'course_id'>
): boolean {
  if (studentLike.role !== 'student') return false
  if (company.is_demo === true) return false
  if (!studentLike.course_id) return false
  return getSharedVisibilityForCourse(studentLike.course_id, company.id)
}

function listVisibleDemoCompaniesForCourse(courseId: number): Company[] {
  return companies.filter(
    (company) =>
      company.is_demo === true &&
      company.is_published === true &&
      getDemoVisibilityForCourse(courseId, company.id)
  )
}

function listVisibleSharedCompaniesForCourse(courseId: number): Company[] {
  return companies.filter(
    (company) => company.is_demo !== true && getSharedVisibilityForCourse(courseId, company.id)
  )
}

export function canWriteCompanyForUser(
  user: Pick<User, 'role' | 'username'>,
  company: Company
): boolean {
  if (company.is_read_only === true) return false
  if (user.role === 'admin') return true
  if (user.role === 'student') {
    return company.owner_username === user.username && company.is_demo !== true
  }
  return true
}

function withViewerAccess(user: Pick<User, 'role' | 'username'>, company: Company): Company {
  return {
    ...company,
    viewer_can_write: canWriteCompanyForUser(user, company),
  }
}

function listCompaniesVisibleToStudent(
  student: Pick<User, 'username' | 'role' | 'course_id'>
): Company[] {
  if (student.role !== 'student') return []

  const ownedNonDemoCompanies = companies.filter(
    (company) => company.owner_username === student.username && company.is_demo !== true
  )
  const visibleDemoCompanies = student.course_id
    ? listVisibleDemoCompaniesForCourse(student.course_id)
    : []
  const visibleSharedCompanies = student.course_id
    ? listVisibleSharedCompaniesForCourse(student.course_id)
    : []

  return Array.from(
    new Map(
      [...ownedNonDemoCompanies, ...visibleDemoCompanies, ...visibleSharedCompanies].map(
        (company) => [company.id, withViewerAccess(student, company)]
      )
    ).values()
  )
}

export function canAccessCompany(user: User, company: Company): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'student') {
    if (company.owner_username === user.username && company.is_demo !== true) return true
    if (isSharedCompanyVisibleForStudentCourse(company, user)) return true
    return isDemoVisibleForStudentCourse(company, user)
  }
  return company.owner_username === user.username
    ? true
    : user.role === 'teacher' && isStudentAssignedToTeacher(company.owner_username, user.username)
}

function isVisibleCompanyInMock(company: Company, user: User): boolean {
  if (company.is_demo !== true) return true
  if (user.role === 'admin') return true
  if (user.role === 'student') return isDemoVisibleForStudentCourse(company, user)
  return company.is_published === true
}

export function listCompaniesForUser(user: User): Company[] {
  if (user.role === 'student') {
    return listCompaniesVisibleToStudent(user)
  }

  return companies
    .filter((company) => canAccessCompany(user, company) && isVisibleCompanyInMock(company, user))
    .map((company) => withViewerAccess(user, company))
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

  return listCompaniesVisibleToStudent(student)
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
  payload: {
    name: string
    description?: string
    tax_id?: string
    opening_entry?: OpeningEntryPayload
  }
): Company {
  const now = new Date().toISOString()
  const newCompany: Company = {
    id: nextCompanyId++,
    name: payload.name,
    description: payload.description ?? null,
    tax_id: payload.tax_id ?? null,
    owner_username: ownerUsername,
    account_count: 0,
    books_closed_until: null,
    is_demo: false,
    is_read_only: false,
    is_published: false,
    demo_slug: null,
    has_opening_entry: false,
    accounting_ready: false,
    opening_entry_id: null,
    created_at: now,
    updated_at: now,
  }
  companies.push(newCompany)

  if (payload.opening_entry) {
    const created = createOpeningEntry(newCompany.id, payload.opening_entry, ownerUsername)
    if (!('error' in created)) {
      newCompany.has_opening_entry = true
      newCompany.accounting_ready = true
      newCompany.opening_entry_id = created.id
    }
  }

  return newCompany
}

export function updateCompany(
  companyId: number,
  payload: { name?: string; description?: string | null; tax_id?: string | null }
): Company | null {
  const idx = companies.findIndex((company) => company.id === companyId)
  if (idx === -1) return null

  companies[idx] = {
    ...companies[idx],
    ...(payload.name !== undefined ? { name: payload.name } : null),
    ...(payload.description !== undefined ? { description: payload.description } : null),
    ...(payload.tax_id !== undefined ? { tax_id: payload.tax_id } : null),
    updated_at: new Date().toISOString(),
  }

  return companies[idx]
}

export function setDemoPublication(
  companyId: number,
  isPublished: boolean
): Company | { error: string; status: number } {
  const idx = companies.findIndex((company) => company.id === companyId)
  if (idx === -1) return { error: 'Not found.', status: 404 }
  if (companies[idx].is_demo !== true) {
    return { error: 'Solo las empresas demo admiten cambios de publicación.', status: 400 }
  }

  companies[idx] = {
    ...companies[idx],
    is_published: isPublished,
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

function nextSyntheticCode(parentCode: string): string {
  const suffixes = Object.values(syntheticAccounts)
    .filter((account) => account.code.startsWith(`${parentCode}.`))
    .map((account) => Number(account.code.split('.').at(-1)))
    .filter((value) => Number.isFinite(value))

  const next = (suffixes.length > 0 ? Math.max(...suffixes) : 0) + 1
  return `${parentCode}.${String(next).padStart(2, '0')}`
}

function registerSyntheticAccount(
  parentCode: string,
  name: string
): {
  id: number
  code: string
  name: string
} {
  const existing = Object.entries(syntheticAccounts).find(
    ([, account]) => account.code.startsWith(`${parentCode}.`) && account.name === name
  )
  if (existing) {
    return {
      id: Number(existing[0]),
      code: existing[1].code,
      name: existing[1].name,
    }
  }

  const id = nextSyntheticAccountId++
  const account = {
    code: nextSyntheticCode(parentCode),
    name,
  }
  syntheticAccounts[id] = account
  return { id, ...account }
}

export function createOpeningEntry(
  companyId: number,
  payload: OpeningEntryPayload,
  createdBy: string
): JournalEntryDetail | { error: string; status: number } {
  const company = getCompanyById(companyId)
  if (!company) return { error: 'Company not found.', status: 404 }
  if (company.is_read_only || company.is_demo) {
    return { error: 'La empresa está en modo solo lectura.', status: 409 }
  }
  if (company.has_opening_entry) {
    return { error: 'La empresa ya tiene apertura registrada.', status: 409 }
  }

  const existingEntries = journalEntries.filter(
    (entry) => journalCompanyMap[entry.id] === companyId
  )
  if (existingEntries.length > 0) {
    return { error: 'La empresa ya tiene asientos previos.', status: 409 }
  }

  const debitLines = payload.assets.map((item) => {
    const account = registerSyntheticAccount(item.parent_code, item.name)
    return {
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      type: 'DEBIT' as const,
      amount: item.amount,
    }
  })

  const creditLines = payload.liabilities.map((item) => {
    const account = registerSyntheticAccount(item.parent_code, item.name)
    return {
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      type: 'CREDIT' as const,
      amount: item.amount,
    }
  })

  const totalDebit = debitLines.reduce((sum, line) => sum + Number(line.amount), 0)
  const liabilitiesTotal = creditLines.reduce((sum, line) => sum + Number(line.amount), 0)
  const capitalAmount = totalDebit - liabilitiesTotal
  if (capitalAmount <= 0) {
    return { error: 'El capital resultante debe ser mayor a cero.', status: 400 }
  }

  const capitalAccount = registerSyntheticAccount('3.01', 'Capital')
  const lines: JournalLine[] = [
    ...debitLines,
    ...creditLines,
    {
      account_id: capitalAccount.id,
      account_code: capitalAccount.code,
      account_name: capitalAccount.name,
      type: 'CREDIT',
      amount: capitalAmount.toFixed(2),
    },
  ]

  const entry: JournalEntryDetail = {
    id: nextJournalId++,
    entry_number: 1,
    date: payload.date,
    description:
      payload.inventory_kind === 'GENERAL' ? 's/ Inventario General' : 's/ Inventario Inicial',
    source_type: 'OPENING',
    source_ref: payload.source_ref ?? '',
    created_by: createdBy,
    reversal_of_id: 0,
    reversed_by_id: null,
    total_debit: totalDebit,
    total_credit: totalDebit,
    lines,
  }

  journalEntries.push(entry)
  journalCompanyMap[entry.id] = companyId
  company.has_opening_entry = true
  company.accounting_ready = true
  company.opening_entry_id = entry.id
  company.account_count = lines.length
  company.updated_at = new Date().toISOString()

  return entry
}

function toJournalList(entry: JournalEntryDetail): JournalEntry {
  const { lines: _lines, ...listEntry } = entry
  return listEntry
}

function resolveAccountName(accountId: number): { code: string; name: string } {
  return syntheticAccounts[accountId] ?? { code: String(accountId), name: `Cuenta ${accountId}` }
}

function toDecimal(amount: number): string {
  return amount.toFixed(2)
}

function sumEntryLinesByPrefix(companyId: number, prefix: string, dateTo?: string): number {
  return listJournalEntryDetailsByCompany(companyId)
    .filter((entry) => (dateTo ? entry.date <= dateTo : true))
    .filter((entry) => !entry.reversal_of_id)
    .reduce((sum, entry) => {
      const delta = entry.lines.reduce((entrySum, line) => {
        if (!line.account_code.startsWith(`${prefix}.`) && line.account_code !== prefix)
          return entrySum
        const amount = Number(line.amount)
        return entrySum + (line.type === 'DEBIT' ? amount : -amount)
      }, 0)
      return sum + delta
    }, 0)
}

function getLastEntryBySourceType(
  companyId: number,
  sourceType: string
): JournalEntryDetail | null {
  return (
    listJournalEntryDetailsByCompany(companyId)
      .filter((entry) => entry.source_type === sourceType)
      .sort((a, b) => a.date.localeCompare(b.date) || b.entry_number - a.entry_number)
      .at(-1) ?? null
  )
}

function inferLogicalExercises(companyId: number): LogicalExercise[] {
  const entries = listJournalEntryDetailsByCompany(companyId).sort((a, b) =>
    a.date === b.date ? a.entry_number - b.entry_number : a.date.localeCompare(b.date)
  )

  const exercises: LogicalExercise[] = []
  let current: LogicalExercise | null = null

  entries.forEach((entry) => {
    if (entry.source_type === 'OPENING' || entry.source_type === 'REOPENING') {
      current = {
        exercise_id: `${entry.source_type === 'OPENING' ? 'opening' : 'reopening'}:${entry.id}`,
        exercise_index: exercises.length + 1,
        opening_entry_id: entry.id,
        opening_source_type: entry.source_type,
        start_date: entry.date,
        closing_entry_id: null,
        closing_date: null,
        snapshot_id: null,
        status: 'open',
      }
      exercises.push(current)
      return
    }

    if (
      entry.source_type === 'PATRIMONIAL_CLOSING' &&
      current &&
      current.closing_entry_id === null
    ) {
      current.closing_entry_id = entry.id
      current.closing_date = entry.date
      current.status = 'closed'
    }
  })

  exercises.forEach((exercise) => {
    if (exercise.closing_entry_id === null) return
    const snapshot = closingSnapshots.find(
      (item) =>
        item.company_id === companyId &&
        item.patrimonial_closing_entry_id === exercise.closing_entry_id
    )
    exercise.snapshot_id = snapshot?.id ?? null
  })

  return exercises
}

export function getLogicalExercises(companyId: number): LogicalExerciseListResponse | null {
  const company = getCompanyById(companyId)
  if (!company) return null

  const exercises = inferLogicalExercises(companyId)
  const currentExercise =
    [...exercises].reverse().find((exercise) => exercise.status === 'open') ?? null

  return {
    company_id: company.id,
    company: company.name,
    current_exercise_id: currentExercise?.exercise_id ?? exercises.at(-1)?.exercise_id ?? null,
    exercises,
  }
}

function getExercisesForPreview(companyId: number): {
  activeExercise: LogicalExercise | null
  previousExercises: LogicalExercise[]
} {
  const logical = getLogicalExercises(companyId)
  if (!logical) return { activeExercise: null, previousExercises: [] }

  const activeExercise =
    logical.exercises.find((exercise) => exercise.exercise_id === logical.current_exercise_id) ??
    logical.exercises.at(-1) ??
    null

  return {
    activeExercise,
    previousExercises: logical.exercises.filter(
      (exercise) => activeExercise === null || exercise.exercise_id !== activeExercise.exercise_id
    ),
  }
}

function buildIncomeStatement(companyId: number, closingDate: string) {
  const summary = buildResultSummary(companyId, closingDate)
  return {
    date: closingDate,
    positive_results: {
      accounts: [],
      total: summary.positive_total,
    },
    negative_results: {
      accounts: [],
      total: summary.negative_total,
    },
    net_result: {
      amount: summary.net_result,
      kind: summary.net_result_kind,
    },
  }
}

function buildBalanceSheet(companyId: number, closingDate: string) {
  const totalAssets = Math.abs(sumEntryLinesByPrefix(companyId, '1', closingDate))
  const totalLiabilities = Math.abs(sumEntryLinesByPrefix(companyId, '2', closingDate))
  const equityTotal = Math.max(totalAssets - totalLiabilities, 0)
  const resultSummary = buildResultSummary(companyId, closingDate)

  return {
    date: closingDate,
    assets: {
      groups: [],
      total: toDecimal(totalAssets),
    },
    liabilities: {
      groups: [],
      total: toDecimal(totalLiabilities),
    },
    equity: {
      groups: [],
      derived_result: {
        name: 'Resultado del Ejercicio',
        amount: resultSummary.net_result,
        kind: resultSummary.net_result_kind,
      },
      total: toDecimal(equityTotal),
    },
    equation: {
      total_assets: toDecimal(totalAssets),
      total_liabilities_plus_equity: toDecimal(totalAssets),
      is_balanced: true,
    },
  }
}

function buildClosingSnapshotLines(
  companyId: number,
  closingDate: string
): ClosingSnapshot['lines'] {
  const balances = new Map<
    number,
    {
      account_id: number
      account_code: string
      account_name: string
      debit_balance: number
      credit_balance: number
    }
  >()

  listJournalEntryDetailsByCompany(companyId)
    .filter((entry) => entry.date <= closingDate)
    .forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!['1', '2', '3'].includes(line.account_code.split('.')[0] ?? '')) return
        const current = balances.get(line.account_id) ?? {
          account_id: line.account_id,
          account_code: line.account_code,
          account_name: line.account_name,
          debit_balance: 0,
          credit_balance: 0,
        }
        if (line.type === 'DEBIT') current.debit_balance += Number(line.amount)
        if (line.type === 'CREDIT') current.credit_balance += Number(line.amount)
        balances.set(line.account_id, current)
      })
    })

  return Array.from(balances.values())
    .sort((a, b) => a.account_code.localeCompare(b.account_code))
    .map((line) => ({
      account_id: line.account_id,
      account_code: line.account_code,
      account_name: line.account_name,
      account_type: line.account_code.startsWith('1')
        ? 'AS'
        : line.account_code.startsWith('2')
          ? 'LI'
          : 'EQ',
      root_code: line.account_code.split('.')[0] ?? '',
      parent_code:
        line.account_code.split('.').length >= 2
          ? line.account_code.split('.').slice(0, 2).join('.')
          : null,
      debit_balance: toDecimal(line.debit_balance),
      credit_balance: toDecimal(line.credit_balance),
    }))
}

export function getLatestClosingSnapshot(companyId: number): ClosingSnapshot | null {
  return (
    closingSnapshots
      .filter((snapshot) => snapshot.company_id === companyId)
      .sort((a, b) => a.id - b.id)
      .at(-1) ?? null
  )
}

export function getClosingSnapshotById(
  companyId: number,
  snapshotId: number
): ClosingSnapshot | null {
  return (
    closingSnapshots.find(
      (snapshot) => snapshot.company_id === companyId && snapshot.id === snapshotId
    ) ?? null
  )
}

function createPreviewDraftEntry(
  base: Omit<ClosingDraftEntry, 'lines'> & { lines?: ClosingDraftEntry['lines'] }
): ClosingDraftEntry {
  return {
    ...base,
    lines: base.lines ?? [],
  }
}

function buildAdjustmentPreview(
  label: 'cash' | 'inventory',
  requestValue: string | undefined,
  bookBalance: number,
  closingDate: string
) {
  if (!requestValue || requestValue.trim().length === 0) {
    return {
      book_balance: null,
      actual_balance: null,
      difference: null,
      status: 'not_requested' as const,
      entry: null,
    }
  }

  const actualBalance = Number(requestValue)
  const difference = Number.isFinite(actualBalance) ? actualBalance - bookBalance : 0
  const roundedDifference = Math.round(difference * 100) / 100

  if (Math.abs(roundedDifference) < 0.001) {
    return {
      book_balance: toDecimal(bookBalance),
      actual_balance: toDecimal(actualBalance),
      difference: '0.00',
      status: 'balanced' as const,
      entry: null,
    }
  }

  const isCash = label === 'cash'
  const shortage = roundedDifference < 0
  const amount = Math.abs(roundedDifference)
  const description = isCash ? 's/ Arqueo realizado a la fecha' : 's/ Inventario de Mercaderías'
  const sourceRef = isCash ? 'CLOSING-CASH' : 'CLOSING-INVENTORY'
  const counterpartName = isCash
    ? shortage
      ? 'Faltante de Caja'
      : 'Sobrante de Caja'
    : shortage
      ? 'Faltante de Mercaderías'
      : 'Sobrante de Mercaderías'

  return {
    book_balance: toDecimal(bookBalance),
    actual_balance: toDecimal(actualBalance),
    difference: toDecimal(roundedDifference),
    status: shortage ? ('shortage' as const) : ('surplus' as const),
    entry: createPreviewDraftEntry({
      date: closingDate,
      description,
      source_type: 'ADJUSTMENT',
      source_ref: sourceRef,
      total_debit: toDecimal(amount),
      total_credit: toDecimal(amount),
      lines: [
        {
          account_id: null,
          account_code: null,
          account_name: counterpartName,
          parent_code: isCash ? '4.12' : '4.13',
          type: shortage ? 'DEBIT' : 'CREDIT',
          amount: toDecimal(amount),
        },
        {
          account_id: null,
          account_code: null,
          account_name: isCash ? 'Caja' : 'Mercaderías',
          parent_code: isCash ? '1.01' : '1.09',
          type: shortage ? 'CREDIT' : 'DEBIT',
          amount: toDecimal(amount),
        },
      ],
    }),
  }
}

function buildResultSummary(companyId: number, closingDate: string) {
  const entries = listJournalEntryDetailsByCompany(companyId).filter(
    (entry) => entry.date <= closingDate
  )

  const totals = entries.reduce(
    (acc, entry) => {
      entry.lines.forEach((line) => {
        const amount = Number(line.amount)
        if (line.account_code.startsWith('5.')) {
          acc.totalNegative += line.type === 'DEBIT' ? amount : -amount
        }
        if (line.account_code.startsWith('4.')) {
          acc.totalPositive += line.type === 'CREDIT' ? amount : -amount
        }
      })
      return acc
    },
    { totalNegative: 0, totalPositive: 0 }
  )

  const netResult = totals.totalPositive - totals.totalNegative

  return {
    negative_total: toDecimal(Math.max(totals.totalNegative, 0)),
    positive_total: toDecimal(Math.max(totals.totalPositive, 0)),
    net_result: toDecimal(Math.abs(netResult)),
    net_result_kind:
      netResult > 0 ? ('gain' as const) : netResult < 0 ? ('loss' as const) : ('neutral' as const),
  }
}

function getLatestJournalDate(companyId: number): string | null {
  return (
    [...listJournalEntryDetailsByCompany(companyId)]
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1)?.date ?? null
  )
}

function buildCurrentBookBalanceSection(
  companyId: number,
  parentCode: '1.01' | '1.09',
  parentName: string,
  dateTo: string
) {
  const totals = listJournalEntryDetailsByCompany(companyId)
    .filter((entry) => entry.date <= dateTo)
    .flatMap((entry) => entry.lines)
    .filter((line) => line.account_code.startsWith(`${parentCode}.`))
    .reduce(
      (acc, line) => {
        const amount = Number(line.amount)
        if (line.type === 'DEBIT') acc.totalDebit += amount
        if (line.type === 'CREDIT') acc.totalCredit += amount
        return acc
      },
      { totalDebit: 0, totalCredit: 0 }
    )

  return {
    parent_code: parentCode,
    parent_name: parentName,
    total_debit: toDecimal(totals.totalDebit),
    total_credit: toDecimal(totals.totalCredit),
    book_balance: toDecimal(totals.totalDebit - totals.totalCredit),
  }
}

export function getCurrentBookBalances(
  companyId: number,
  dateTo?: string
): CurrentBookBalances | { error: string; status: number } {
  const company = getCompanyById(companyId)
  if (!company) return { error: 'Company not found.', status: 404 }
  if (company.accounting_ready === false || !company.has_opening_entry) {
    return {
      error: 'La empresa debe tener apertura contable para consultar saldos contables actuales.',
      status: 409,
    }
  }

  const resolvedDate =
    dateTo || getLatestJournalDate(companyId) || new Date().toISOString().slice(0, 10)

  return {
    company_id: company.id,
    company: company.name,
    as_of_date: resolvedDate,
    books_closed_until: company.books_closed_until ?? null,
    cash: buildCurrentBookBalanceSection(companyId, '1.01', 'Caja', resolvedDate),
    inventory: buildCurrentBookBalanceSection(companyId, '1.09', 'Mercaderías', resolvedDate),
  }
}

export function buildClosingPreviewResponse(
  companyId: number,
  payload: SimplifiedClosingRequest
): SimplifiedClosingPreview | { error: string; status: number } {
  const company = getCompanyById(companyId)
  if (!company) return { error: 'Company not found.', status: 404 }
  if (company.accounting_ready === false || !company.has_opening_entry) {
    return {
      error: 'La empresa debe tener apertura contable antes de ejecutar un cierre.',
      status: 409,
    }
  }
  if (company.is_read_only) {
    return { error: 'La empresa está en modo solo lectura.', status: 409 }
  }
  if (!payload.closing_date || !payload.reopening_date) {
    return { error: 'Las fechas de cierre y reapertura son obligatorias.', status: 400 }
  }
  if (payload.reopening_date <= payload.closing_date) {
    return { error: 'La fecha de reapertura debe ser posterior a la fecha de cierre.', status: 400 }
  }
  if (company.books_closed_until && payload.closing_date <= company.books_closed_until) {
    return { error: 'Los libros ya están cerrados hasta la fecha indicada.', status: 409 }
  }

  const companyEntries = listJournalEntryDetailsByCompany(companyId)
  if (companyEntries.some((entry) => entry.date > payload.closing_date)) {
    return {
      error: 'No se puede cerrar porque existen asientos posteriores a la fecha de cierre.',
      status: 409,
    }
  }
  if (
    companyEntries.some(
      (entry) => entry.source_type === 'PATRIMONIAL_CLOSING' && entry.date === payload.closing_date
    )
  ) {
    return { error: 'Ya existe un cierre para esa fecha.', status: 409 }
  }
  if (
    companyEntries.some(
      (entry) => entry.source_type === 'REOPENING' && entry.date === payload.reopening_date
    )
  ) {
    return { error: 'Ya existe una reapertura para esa fecha.', status: 409 }
  }

  const cashAdjustment = buildAdjustmentPreview(
    'cash',
    payload.cash_actual,
    sumEntryLinesByPrefix(companyId, '1.01', payload.closing_date),
    payload.closing_date
  )
  const inventoryAdjustment = buildAdjustmentPreview(
    'inventory',
    payload.inventory_actual,
    sumEntryLinesByPrefix(companyId, '1.09', payload.closing_date),
    payload.closing_date
  )
  const resultSummary = buildResultSummary(companyId, payload.closing_date)
  const exercisesPreview = getExercisesForPreview(companyId)
  const incomeStatement = buildIncomeStatement(companyId, payload.closing_date)
  const balanceSheet = buildBalanceSheet(companyId, payload.closing_date)
  const patrimonialAmount = Math.max(
    0,
    Math.abs(sumEntryLinesByPrefix(companyId, '1', payload.closing_date)) +
      Math.abs(sumEntryLinesByPrefix(companyId, '2', payload.closing_date)) +
      Math.abs(sumEntryLinesByPrefix(companyId, '3', payload.closing_date))
  )

  const resultClosingEntries: ClosingDraftEntry[] = []
  if (Number(resultSummary.negative_total) > 0) {
    resultClosingEntries.push(
      createPreviewDraftEntry({
        date: payload.closing_date,
        description: 'Por cierre de cuentas de Resultado Negativo (Pérdidas)',
        source_type: 'RESULT_CLOSING',
        source_ref: 'CLOSING-RN',
        total_debit: resultSummary.negative_total,
        total_credit: resultSummary.negative_total,
      })
    )
  }
  if (Number(resultSummary.positive_total) > 0) {
    resultClosingEntries.push(
      createPreviewDraftEntry({
        date: payload.closing_date,
        description: 'Por cierre de cuentas de Resultado Positivo (Ganancias)',
        source_type: 'RESULT_CLOSING',
        source_ref: 'CLOSING-RP',
        total_debit: resultSummary.positive_total,
        total_credit: resultSummary.positive_total,
      })
    )
  }

  return {
    company_id: companyId,
    company: company.name,
    closing_date: payload.closing_date,
    reopening_date: payload.reopening_date,
    books_closed_until: company.books_closed_until ?? null,
    active_exercise: exercisesPreview.activeExercise,
    previous_exercises: exercisesPreview.previousExercises,
    adjustments: {
      cash: cashAdjustment,
      inventory: inventoryAdjustment,
    },
    result_summary: resultSummary,
    income_statement: incomeStatement,
    balance_sheet: balanceSheet,
    entries: {
      adjustments: [cashAdjustment.entry, inventoryAdjustment.entry].filter(
        (entry): entry is ClosingDraftEntry => entry !== null
      ),
      result_closing: resultClosingEntries,
      patrimonial_closing: createPreviewDraftEntry({
        date: payload.closing_date,
        description: 'Por cierre de Cuentas Patrimoniales',
        source_type: 'PATRIMONIAL_CLOSING',
        source_ref: 'CLOSING-PATRIMONIAL',
        total_debit: toDecimal(patrimonialAmount),
        total_credit: toDecimal(patrimonialAmount),
      }),
      reopening: createPreviewDraftEntry({
        date: payload.reopening_date,
        description: 'Por apertura de Cuentas Patrimoniales',
        source_type: 'REOPENING',
        source_ref: 'REOPENING-PATRIMONIAL',
        total_debit: toDecimal(patrimonialAmount),
        total_credit: toDecimal(patrimonialAmount),
      }),
    },
  }
}

function createSpecialEntry(
  companyId: number,
  createdBy: string,
  draft: ClosingDraftEntry
): JournalEntryDetail {
  const maxEntryNumber = Math.max(
    0,
    ...journalEntries
      .filter((entry) => journalCompanyMap[entry.id] === companyId)
      .map((entry) => entry.entry_number)
  )

  const lines: JournalLine[] = draft.lines.map((line) => {
    const parentCode = line.parent_code ?? '3.02'
    const account = registerSyntheticAccount(parentCode, line.account_name)
    return {
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      type: line.type,
      amount: line.amount,
    }
  })

  const created: JournalEntryDetail = {
    id: nextJournalId++,
    entry_number: maxEntryNumber + 1,
    date: draft.date,
    description: draft.description,
    source_type: draft.source_type,
    source_ref: draft.source_ref,
    created_by: createdBy,
    reversal_of_id: null,
    reversed_by_id: null,
    total_debit: Number(draft.total_debit),
    total_credit: Number(draft.total_credit),
    lines,
  }

  journalEntries.push(created)
  journalCompanyMap[created.id] = companyId

  return created
}

export function getClosingState(companyId: number): ClosingState | null {
  const company = getCompanyById(companyId)
  if (!company) return null

  const lastPatrimonialClosing = getLastEntryBySourceType(companyId, 'PATRIMONIAL_CLOSING')
  const lastReopening = getLastEntryBySourceType(companyId, 'REOPENING')
  const logicalExercises = getLogicalExercises(companyId)
  const currentExercise =
    logicalExercises?.exercises.find(
      (exercise) => exercise.exercise_id === logicalExercises.current_exercise_id
    ) ?? null

  return {
    company_id: company.id,
    company: company.name,
    books_closed_until: company.books_closed_until ?? null,
    last_patrimonial_closing_entry_id: lastPatrimonialClosing?.id ?? null,
    last_patrimonial_closing_date: lastPatrimonialClosing?.date ?? null,
    last_reopening_entry_id: lastReopening?.id ?? null,
    last_reopening_date: lastReopening?.date ?? null,
    current_exercise: currentExercise,
    can_close: company.has_opening_entry === true && company.is_read_only !== true,
  }
}

export function executeClosing(
  companyId: number,
  payload: SimplifiedClosingRequest,
  createdBy: string
): SimplifiedClosingExecuteResponse | { error: string; status: number } {
  const preview = buildClosingPreviewResponse(companyId, payload)
  if ('error' in preview) return preview

  const company = getCompanyById(companyId)
  if (!company) return { error: 'Company not found.', status: 404 }

  const drafts = [
    ...preview.entries.adjustments,
    ...preview.entries.result_closing,
    ...(preview.entries.patrimonial_closing ? [preview.entries.patrimonial_closing] : []),
    ...(preview.entries.reopening ? [preview.entries.reopening] : []),
  ]

  const previewLines = buildClosingSnapshotLines(companyId, payload.closing_date)
  const createdEntries = drafts.map((draft) => createSpecialEntry(companyId, createdBy, draft))
  const patrimonialClosingEntry =
    createdEntries.find((entry) => entry.source_type === 'PATRIMONIAL_CLOSING') ?? null
  const reopeningEntry = createdEntries.find((entry) => entry.source_type === 'REOPENING') ?? null
  const snapshotId = nextClosingSnapshotId++
  closingSnapshots.push({
    id: snapshotId,
    company_id: company.id,
    company: company.name,
    patrimonial_closing_entry_id: patrimonialClosingEntry?.id ?? null,
    reopening_entry_id: reopeningEntry?.id ?? null,
    closing_date: payload.closing_date,
    reopening_date: payload.reopening_date,
    balance_sheet: preview.balance_sheet,
    income_statement: preview.income_statement,
    lines: previewLines,
  })
  company.books_closed_until = payload.closing_date
  company.updated_at = new Date().toISOString()

  return {
    company_id: company.id,
    company: company.name,
    closing_date: payload.closing_date,
    reopening_date: payload.reopening_date,
    books_closed_until: company.books_closed_until,
    snapshot_id: snapshotId,
    created_entries: createdEntries.map((entry) => ({
      id: entry.id,
      entry_number: entry.entry_number,
      date: entry.date,
      description: entry.description,
      source_type: entry.source_type,
      source_ref: entry.source_ref,
    })),
  }
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
): JournalEntryDetail | { error: string; status: number } {
  const company = getCompanyById(companyId)
  if (!company) {
    return { error: 'Company not found.', status: 404 }
  }
  if (company.is_read_only) {
    return { error: 'La empresa está en modo solo lectura.', status: 409 }
  }
  if (company.accounting_ready === false) {
    return {
      error:
        'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
      status: 409,
    }
  }
  if (company.books_closed_until && payload.date <= company.books_closed_until) {
    return {
      error: 'Los libros ya están cerrados hasta la fecha indicada.',
      status: 409,
    }
  }
  if (!payload.lines || payload.lines.length < 2) {
    return { error: 'Se requieren al menos 2 líneas.', status: 400 }
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
    return { error: 'El asiento debe estar balanceado.', status: 400 }
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

export function resetMockDb() {
  users.splice(0, users.length, ...structuredClone(initialUsers))
  courses.splice(0, courses.length, ...structuredClone(initialCourses))
  courseDemoCompanyVisibilities.splice(
    0,
    courseDemoCompanyVisibilities.length,
    ...structuredClone(initialCourseDemoCompanyVisibilities)
  )
  courseSharedCompanyVisibilities.splice(
    0,
    courseSharedCompanyVisibilities.length,
    ...structuredClone(initialCourseSharedCompanyVisibilities)
  )
  companies.splice(0, companies.length, ...structuredClone(initialCompanies))
  journalEntries.splice(0, journalEntries.length, ...structuredClone(initialJournalEntries))

  Object.keys(journalCompanyMap).forEach((key) => {
    delete journalCompanyMap[Number(key)]
  })
  Object.assign(journalCompanyMap, structuredClone(initialJournalCompanyMap))

  Object.keys(syntheticAccounts).forEach((key) => {
    delete syntheticAccounts[Number(key)]
  })
  Object.assign(syntheticAccounts, structuredClone(initialSyntheticAccounts))
  closingSnapshots.splice(0, closingSnapshots.length, ...structuredClone(initialClosingSnapshots))

  accountChartConfig = structuredClone(initialAccountChartConfig)
  registrationCodeState = structuredClone(initialRegistrationCodeState)
  registerAttemptsTimestamps = []
  sessionsByRefreshToken.clear()

  nextCourseId = initialCounters.nextCourseId
  nextUserId = initialCounters.nextUserId
  nextCompanyId = initialCounters.nextCompanyId
  nextJournalId = initialCounters.nextJournalId
  nextSyntheticAccountId = initialCounters.nextSyntheticAccountId
  nextClosingSnapshotId = initialCounters.nextClosingSnapshotId
}

export function reverseJournalEntry(
  companyId: number,
  entryId: number,
  payload: ReverseJournalEntryPayload,
  createdBy: string
): JournalEntryDetail | { error: string; status: number } {
  const company = getCompanyById(companyId)
  if (!company) return { error: 'Company not found.', status: 404 }
  if (company.is_read_only) {
    return { error: 'La empresa está en modo solo lectura.', status: 409 }
  }
  if (company.accounting_ready === false) {
    return {
      error:
        'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
      status: 409,
    }
  }
  const original = getJournalEntry(companyId, entryId)
  if (!original) return { error: 'Not found.', status: 404 }
  if (isNonReversibleJournalSourceType(original.source_type)) {
    return {
      error: 'Este asiento fue generado por un proceso de cierre y no puede revertirse.',
      status: 409,
    }
  }
  if (original.reversed_by_id) {
    return { error: 'El asiento ya fue reversado.', status: 409 }
  }
  const reverseDate = payload.date ?? new Date().toISOString().slice(0, 10)
  if (company.books_closed_until && reverseDate <= company.books_closed_until) {
    return {
      error: 'Los libros ya están cerrados hasta la fecha indicada.',
      status: 409,
    }
  }

  const maxEntryNumber = Math.max(
    0,
    ...journalEntries
      .filter((entry) => journalCompanyMap[entry.id] === companyId)
      .map((entry) => entry.entry_number)
  )

  const reversedLines: JournalLine[] = original.lines.map((line) => ({
    ...line,
    type: line.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
  }))

  const reversed: JournalEntryDetail = {
    id: nextJournalId++,
    entry_number: maxEntryNumber + 1,
    date: reverseDate,
    description: payload.description ?? `Reversa: ${original.description}`,
    source_type: 'REVERSAL',
    source_ref: String(original.id),
    created_by: createdBy,
    reversal_of_id: original.id,
    reversed_by_id: null,
    total_debit: original.total_credit,
    total_credit: original.total_debit,
    lines: reversedLines.map((line) => ({
      ...line,
      amount: line.amount,
    })),
  }

  original.reversed_by_id = reversed.id
  journalEntries.push(reversed)
  journalCompanyMap[reversed.id] = companyId

  return reversed
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

function toCourseResponse(course: Course): {
  id: number
  name: string
  code: string | null
  teacher_id: number
  teacher_username: string
  student_count: number
  created_at: string
  updated_at: string
} {
  return {
    id: course.id,
    name: course.name,
    code: course.code,
    teacher_id: course.teacher_id,
    teacher_username: course.teacher_username,
    student_count: course.student_usernames.length,
    created_at: course.created_at,
    updated_at: course.updated_at,
  }
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
  return visibleCourses.map(toCourseResponse)
}

export function listTeacherCoursesOverview(user: User): Array<{
  course_id: number
  course_name: string
  course_code: string | null
  teacher_id: number
  teacher_username: string
  student_count: number
  totals: {
    company_count: number
    journal_entry_count: number
  }
  students: Array<{
    student_id: number
    student_username: string
    student_full_name: string
    company_count: number
    journal_entry_count: number
  }>
}> {
  return courses
    .filter((course) => canAccessCourse(user, course))
    .map((course) => {
      const students = course.student_usernames
        .map((username) => users.find((candidate) => candidate.username === username))
        .filter((student): student is MockUserRecord => student !== undefined)
        .map((student) => {
          const studentCompanies = listCompaniesVisibleToStudent(student)
          const studentCompanyIds = new Set(studentCompanies.map((company) => company.id))
          const studentEntries = journalEntries.filter((entry) =>
            studentCompanyIds.has(journalCompanyMap[entry.id])
          )

          return {
            student_id: student.id,
            student_username: student.username,
            student_full_name: `${student.first_name} ${student.last_name}`.trim(),
            company_count: studentCompanies.length,
            journal_entry_count: studentEntries.length,
          }
        })

      return {
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        teacher_id: course.teacher_id,
        teacher_username: course.teacher_username,
        student_count: students.length,
        totals: {
          company_count: students.reduce((acc, student) => acc + student.company_count, 0),
          journal_entry_count: students.reduce(
            (acc, student) => acc + student.journal_entry_count,
            0
          ),
        },
        students,
      }
    })
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
  return toCourseResponse(created)
}

export function getCourseForUser(
  user: User,
  courseId: number
): {
  id: number
  name: string
  code: string | null
  teacher_id: number
  teacher_username: string
  student_count: number
  created_at: string
  updated_at: string
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null
  return toCourseResponse(course)
}

export function updateCourseForUser(
  user: User,
  courseId: number,
  payload: { name?: string; code?: string; teacher_id?: number }
):
  | {
      ok: true
      course: {
        id: number
        name: string
        code: string | null
        teacher_id: number
        teacher_username: string
        student_count: number
        created_at: string
        updated_at: string
      }
    }
  | { ok: false; status: number; detail: string } {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return { ok: false, status: 403, detail: 'Forbidden' }

  if (payload.name !== undefined && payload.name.trim().length === 0) {
    return { ok: false, status: 400, detail: 'Validation error' }
  }

  course.name = payload.name?.trim() || course.name
  if (payload.code !== undefined) {
    course.code = payload.code.trim().length > 0 ? payload.code.trim() : null
  }
  // Backend contract note: teacher_id in PATCH currently does not change owner.
  course.updated_at = new Date().toISOString()

  return { ok: true, course: toCourseResponse(course) }
}

export function deleteCourseForUser(
  user: User,
  courseId: number
): { ok: true } | { ok: false; status: number; detail: string } {
  const idx = courses.findIndex((candidate) => candidate.id === courseId)
  if (idx === -1) return { ok: false, status: 404, detail: 'Course not found' }

  if (!canAccessCourse(user, courses[idx])) {
    return { ok: false, status: 403, detail: 'Forbidden' }
  }

  const removed = courses[idx]
  removed.student_usernames.forEach((username) => {
    const student = users.find((candidate) => candidate.username === username)
    if (student && student.course_id === removed.id) student.course_id = null
  })

  courses.splice(idx, 1)
  return { ok: true }
}

export function listCourseEnrollmentsForUser(
  user: User,
  courseId: number
): Array<{
  student_id: number
  student_username: string
  student_full_name: string
}> | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  return course.student_usernames
    .map((username) => users.find((candidate) => candidate.username === username))
    .filter((student): student is MockUserRecord => student !== undefined)
    .map((student) => ({
      student_id: student.id,
      student_username: student.username,
      student_full_name: `${student.first_name} ${student.last_name}`.trim(),
    }))
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
        companies: listCompaniesVisibleToStudent(student).map((company) => ({
          id: company.id,
          name: company.name,
          tax_id: company.tax_id ?? '',
          is_demo: company.is_demo ?? false,
          is_read_only: company.is_read_only ?? false,
          viewer_can_write:
            typeof company.viewer_can_write === 'boolean' ? company.viewer_can_write : true,
          is_published: company.is_published ?? false,
          demo_slug: company.demo_slug ?? null,
          has_opening_entry: company.has_opening_entry ?? false,
          accounting_ready: company.accounting_ready ?? false,
          opening_entry_id: company.opening_entry_id ?? null,
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
  const allowedCompanies = Array.from(
    new Set([
      ...companies
        .filter((company) => courseStudentSet.has(company.owner_username))
        .map((company) => company.id),
      ...listVisibleSharedCompaniesForCourse(course.id).map((company) => company.id),
    ])
  )

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

export function getTeacherStudentContext(
  user: User,
  studentId: number,
  filters: { company_id?: number; entries_limit?: number }
): {
  student: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
    course_id: number | null
    course_name: string
  }
  companies: Array<{
    id: number
    name: string
    tax_id: string
    account_count: number
    journal_entry_count: number
    last_entry_date: string | null
    books_closed_until: string | null
    created_at: string
    updated_at: string
  }>
  selected_company_id: number | null
  journal_entries: Array<{
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
  const student = users.find(
    (candidate) => candidate.id === studentId && candidate.role === 'student'
  )
  if (!student) return null

  const course = student.course_id
    ? courses.find((candidate) => candidate.id === student.course_id)
    : null
  if (!course) return null
  if (!canAccessCourse(user, course)) return null

  const visibleCompanies = listCompaniesVisibleToStudent(student)
  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id))

  const studentCompanies = visibleCompanies
    .filter((company) => visibleCompanyIds.has(company.id))
    .map((company) => {
      const companyEntries = journalEntries
        .filter((entry) => journalCompanyMap[entry.id] === company.id)
        .sort((a, b) => b.date.localeCompare(a.date))
      return {
        id: company.id,
        name: company.name,
        tax_id: company.tax_id ?? '',
        account_count: company.account_count,
        journal_entry_count: companyEntries.length,
        last_entry_date: companyEntries[0]?.date ?? null,
        is_demo: company.is_demo ?? false,
        is_read_only: company.is_read_only ?? false,
        viewer_can_write:
          typeof company.viewer_can_write === 'boolean' ? company.viewer_can_write : true,
        is_published: company.is_published ?? false,
        demo_slug: company.demo_slug ?? null,
        has_opening_entry: company.has_opening_entry ?? false,
        accounting_ready: company.accounting_ready ?? false,
        opening_entry_id: company.opening_entry_id ?? null,
        books_closed_until: company.books_closed_until ?? null,
        created_at: company.created_at,
        updated_at: company.updated_at,
      }
    })

  const selectedCompanyId =
    filters.company_id && studentCompanies.some((company) => company.id === filters.company_id)
      ? filters.company_id
      : null
  const entriesLimit = Math.min(100, Math.max(1, filters.entries_limit ?? 25))

  const journal_entries =
    selectedCompanyId === null
      ? []
      : listJournalEntryDetailsByCompany(selectedCompanyId)
          .sort((a, b) => {
            if (a.date === b.date) return b.entry_number - a.entry_number
            return b.date.localeCompare(a.date)
          })
          .slice(0, entriesLimit)
          .map((entry) => ({
            id: entry.id,
            entry_number: entry.entry_number,
            date: entry.date,
            description: entry.description,
            source_type: entry.source_type,
            source_ref: entry.source_ref,
            company_id: selectedCompanyId,
            company_name:
              studentCompanies.find((company) => company.id === selectedCompanyId)?.name ?? '',
            student_id: student.id,
            student_username: student.username,
            created_by: entry.created_by,
            reversal_of_id: entry.reversal_of_id ?? 0,
            reversed_by_id: entry.reversed_by_id ?? null,
            lines: entry.lines,
          }))

  return {
    student: {
      id: student.id,
      username: student.username,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`.trim(),
      course_id: course.id,
      course_name: course.name,
    },
    companies: studentCompanies,
    selected_company_id: selectedCompanyId,
    journal_entries,
  }
}

function listAvailableDemoCompaniesForCourse(user: User): Company[] {
  return companies.filter((company) => {
    if (company.is_demo !== true) return false
    if (user.role !== 'admin' && company.is_published !== true) return false
    return true
  })
}

function listAvailableSharedCompaniesForCourse(user: User, courseId: number): Company[] {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return []

  if (user.role === 'admin') {
    return companies.filter((company) => company.is_demo !== true)
  }

  return companies.filter(
    (company) => company.is_demo !== true && company.owner_username === user.username
  )
}

function buildCourseDemoCompanyVisibilityItem(courseId: number, company: Company) {
  const journalEntryCount = journalEntries.filter(
    (entry) => journalCompanyMap[entry.id] === company.id
  ).length

  return {
    company_id: company.id,
    company_name: company.name,
    is_demo: true,
    is_read_only: company.is_read_only === true,
    is_published: company.is_published === true,
    demo_slug: company.demo_slug ?? null,
    is_visible: getDemoVisibilityForCourse(courseId, company.id),
    account_count: company.account_count,
    journal_entry_count: journalEntryCount,
  }
}

function buildCourseSharedCompanyVisibilityItem(courseId: number, company: Company) {
  const journalEntryCount = journalEntries.filter(
    (entry) => journalCompanyMap[entry.id] === company.id
  ).length
  const owner = users.find((candidate) => candidate.username === company.owner_username)

  return {
    company_id: company.id,
    company_name: company.name,
    owner_id: owner?.id ?? null,
    owner_username: company.owner_username,
    is_demo: false,
    is_read_only: company.is_read_only === true,
    is_published: company.is_published === true,
    demo_slug: company.demo_slug ?? null,
    is_visible: getSharedVisibilityForCourse(courseId, company.id),
    account_count: company.account_count,
    journal_entry_count: journalEntryCount,
  }
}

export function listCourseDemoCompanies(
  user: User,
  courseId: number
): {
  course_id: number
  course_name: string
  demo_companies: Array<ReturnType<typeof buildCourseDemoCompanyVisibilityItem>>
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  return {
    course_id: course.id,
    course_name: course.name,
    demo_companies: listAvailableDemoCompaniesForCourse(user).map((company) =>
      buildCourseDemoCompanyVisibilityItem(course.id, company)
    ),
  }
}

export function listCourseSharedCompanies(
  user: User,
  courseId: number
): {
  course_id: number
  course_name: string
  shared_companies: Array<ReturnType<typeof buildCourseSharedCompanyVisibilityItem>>
} | null {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return null

  return {
    course_id: course.id,
    course_name: course.name,
    shared_companies: listAvailableSharedCompaniesForCourse(user, course.id).map((company) =>
      buildCourseSharedCompanyVisibilityItem(course.id, company)
    ),
  }
}

export function setCourseDemoCompanyVisibility(
  user: User,
  courseId: number,
  companyId: number,
  isVisible: boolean
):
  | { ok: true; item: ReturnType<typeof buildCourseDemoCompanyVisibilityItem> }
  | { ok: false; status: number; detail: string } {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return { ok: false, status: 403, detail: 'Forbidden' }

  const company = getCompanyById(companyId)
  if (!company || company.is_demo !== true) {
    return { ok: false, status: 404, detail: 'Demo company not found' }
  }

  if (user.role !== 'admin' && company.is_published !== true) {
    return { ok: false, status: 404, detail: 'Demo company not found' }
  }

  const existing = courseDemoCompanyVisibilities.find(
    (visibility) => visibility.course_id === course.id && visibility.company_id === company.id
  )

  if (existing) {
    existing.is_visible = isVisible
  } else {
    courseDemoCompanyVisibilities.push({
      course_id: course.id,
      company_id: company.id,
      is_visible: isVisible,
    })
  }

  return { ok: true, item: buildCourseDemoCompanyVisibilityItem(course.id, company) }
}

export function setCourseSharedCompanyVisibility(
  user: User,
  courseId: number,
  companyId: number,
  isVisible: boolean
):
  | { ok: true; item: ReturnType<typeof buildCourseSharedCompanyVisibilityItem> }
  | { ok: false; status: number; detail: string } {
  const course = findAccessibleCourse(user, courseId)
  if (!course) return { ok: false, status: 403, detail: 'Forbidden' }

  const company = getCompanyById(companyId)
  if (!company || company.is_demo === true) {
    return { ok: false, status: 404, detail: 'Shared company not found' }
  }

  const allowedCompanies = listAvailableSharedCompaniesForCourse(user, course.id)
  if (!allowedCompanies.some((candidate) => candidate.id === company.id)) {
    return { ok: false, status: 404, detail: 'Shared company not found' }
  }

  const existing = courseSharedCompanyVisibilities.find(
    (visibility) => visibility.course_id === course.id && visibility.company_id === company.id
  )

  if (existing) {
    existing.is_visible = isVisible
  } else {
    courseSharedCompanyVisibilities.push({
      course_id: course.id,
      company_id: company.id,
      is_visible: isVisible,
    })
  }

  return { ok: true, item: buildCourseSharedCompanyVisibilityItem(course.id, company) }
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

export function updateUserRole(userId: number, role: Role): User | null {
  const idx = users.findIndex((user) => user.id === userId)
  if (idx === -1) return null

  users[idx] = {
    ...users[idx],
    role,
    is_staff: role !== 'student',
  }

  return toPublicUser(users[idx])
}
