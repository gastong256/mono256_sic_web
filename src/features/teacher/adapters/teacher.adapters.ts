import type {
  CourseItem,
  TeacherAvailableStudent,
  TeacherAvailableStudentsResponse,
  TeacherCompanyItem,
  TeacherCourseCompaniesResponse,
  TeacherCourseJournalEntriesResponse,
  TeacherCourseJournalEntry,
  TeacherStudentCompanies,
} from '@/features/teacher/types/teacher.types'
import { extractListPayload, extractPaginationMeta } from '@/shared/lib/apiPagination'
import { isRecord, toDecimalString, toNumberValue, toStringValue } from '@/shared/lib/valueParsers'

export function normalizeTeacherCourse(raw: unknown): CourseItem | null {
  if (!isRecord(raw)) return null
  const id = toNumberValue(raw.id)
  if (id <= 0) return null

  return {
    id,
    name: toStringValue(raw.name),
    ...(typeof raw.code === 'string' ? { code: raw.code } : {}),
    ...(raw.teacher_id === null || typeof raw.teacher_id === 'number'
      ? { teacher_id: raw.teacher_id }
      : {}),
    ...(typeof raw.teacher_username === 'string' ? { teacher_username: raw.teacher_username } : {}),
    ...(typeof raw.student_count === 'number' ? { student_count: raw.student_count } : {}),
    ...(typeof raw.created_at === 'string' ? { created_at: raw.created_at } : {}),
    ...(typeof raw.updated_at === 'string' ? { updated_at: raw.updated_at } : {}),
  }
}

export function normalizeTeacherCoursesPayload(payload: unknown): CourseItem[] {
  return extractListPayload<unknown>(payload)
    .map(normalizeTeacherCourse)
    .filter((course): course is CourseItem => course !== null)
}

function normalizeCompany(raw: unknown): TeacherCompanyItem | null {
  if (!isRecord(raw)) return null
  const id = toNumberValue(raw.id)
  if (id <= 0) return null
  return {
    id,
    name: toStringValue(raw.name),
    tax_id: typeof raw.tax_id === 'string' ? raw.tax_id : null,
    created_at: toStringValue(raw.created_at),
  }
}

function normalizeStudentGroup(raw: unknown): TeacherStudentCompanies | null {
  if (!isRecord(raw)) return null

  const nestedStudent = isRecord(raw.student) ? raw.student : null
  const studentId = toNumberValue(raw.student_id ?? nestedStudent?.id)
  if (studentId <= 0) return null

  const firstName = toStringValue(nestedStudent?.first_name)
  const lastName = toStringValue(nestedStudent?.last_name)
  const fullNameFromParts = `${firstName} ${lastName}`.trim()

  const companiesRaw = Array.isArray(raw.companies)
    ? raw.companies
    : isRecord(raw.company)
      ? [raw.company]
      : []

  return {
    student_id: studentId,
    student_username: toStringValue(raw.student_username ?? nestedStudent?.username),
    student_full_name: toStringValue(raw.student_full_name) || fullNameFromParts,
    companies: companiesRaw
      .map(normalizeCompany)
      .filter((company): company is TeacherCompanyItem => company !== null),
  }
}

function mergeStudentGroups(groups: TeacherStudentCompanies[]): TeacherStudentCompanies[] {
  const byId = new Map<number, TeacherStudentCompanies>()

  groups.forEach((group) => {
    const current = byId.get(group.student_id)
    if (!current) {
      byId.set(group.student_id, {
        ...group,
        companies: [...group.companies],
      })
      return
    }

    const companyIds = new Set(current.companies.map((company) => company.id))
    group.companies.forEach((company) => {
      if (!companyIds.has(company.id)) current.companies.push(company)
    })
    if (!current.student_username && group.student_username)
      current.student_username = group.student_username
    if (!current.student_full_name && group.student_full_name)
      current.student_full_name = group.student_full_name
  })

  return Array.from(byId.values())
}

export function normalizeTeacherCourseCompaniesPayload(
  payload: unknown,
  fallbackCourseId: number
): TeacherCourseCompaniesResponse {
  if (isRecord(payload) && Array.isArray(payload.students)) {
    return {
      course_id: toNumberValue(payload.course_id, fallbackCourseId),
      course_name: toStringValue(payload.course_name),
      students: payload.students
        .map(normalizeStudentGroup)
        .filter((student): student is TeacherStudentCompanies => student !== null),
    }
  }

  const students = extractListPayload<unknown>(payload)
    .map(normalizeStudentGroup)
    .filter((student): student is TeacherStudentCompanies => student !== null)

  return {
    course_id: isRecord(payload)
      ? toNumberValue(payload.course_id, fallbackCourseId)
      : fallbackCourseId,
    course_name: isRecord(payload) ? toStringValue(payload.course_name) : '',
    students: mergeStudentGroups(students),
  }
}

function normalizeTeacherJournalEntry(raw: unknown): TeacherCourseJournalEntry | null {
  if (!isRecord(raw)) return null
  const id = toNumberValue(raw.id)
  if (id <= 0) return null

  const linesRaw = Array.isArray(raw.lines) ? raw.lines : []

  return {
    id,
    entry_number: toNumberValue(raw.entry_number),
    date: toStringValue(raw.date),
    description: toStringValue(raw.description),
    source_type: toStringValue(raw.source_type),
    source_ref: toStringValue(raw.source_ref),
    company_id: toNumberValue(raw.company_id),
    company_name: toStringValue(raw.company_name),
    student_id: toNumberValue(raw.student_id),
    student_username: toStringValue(raw.student_username),
    created_by: toStringValue(raw.created_by),
    reversal_of_id:
      typeof raw.reversal_of_id === 'number' && Number.isFinite(raw.reversal_of_id)
        ? raw.reversal_of_id
        : null,
    reversed_by_id:
      typeof raw.reversed_by_id === 'number' && Number.isFinite(raw.reversed_by_id)
        ? raw.reversed_by_id
        : null,
    lines: linesRaw.map((line) => {
      const entry = isRecord(line) ? line : {}
      return {
        account_id: toNumberValue(entry.account_id),
        account_code: toStringValue(entry.account_code),
        account_name: toStringValue(entry.account_name),
        type: entry.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        amount: toDecimalString(entry.amount, '0'),
      }
    }),
  }
}

export function normalizeTeacherCourseJournalEntriesPayload(
  payload: unknown
): TeacherCourseJournalEntriesResponse {
  const results = extractListPayload<unknown>(payload)
    .map(normalizeTeacherJournalEntry)
    .filter((entry): entry is TeacherCourseJournalEntry => entry !== null)
  const meta = extractPaginationMeta(payload, results.length)

  return {
    count: meta.count ?? results.length,
    next: meta.next,
    previous: meta.previous,
    results,
  }
}

function normalizeAvailableStudent(raw: unknown): TeacherAvailableStudent | null {
  if (!isRecord(raw)) return null
  const id = toNumberValue(raw.id)
  if (id <= 0) return null
  const firstName = toStringValue(raw.first_name)
  const lastName = toStringValue(raw.last_name)
  const fullNameFromParts = `${firstName} ${lastName}`.trim()
  return {
    id,
    username: toStringValue(raw.username),
    first_name: firstName,
    last_name: lastName,
    full_name: toStringValue(raw.full_name) || fullNameFromParts || toStringValue(raw.username),
  }
}

export function normalizeTeacherAvailableStudentsPayload(
  payload: unknown
): TeacherAvailableStudentsResponse {
  const results = extractListPayload<unknown>(payload)
    .map(normalizeAvailableStudent)
    .filter((student): student is TeacherAvailableStudent => student !== null)
  const meta = extractPaginationMeta(payload, results.length)

  return {
    count: meta.count ?? results.length,
    next: meta.next,
    previous: meta.previous,
    results,
  }
}
