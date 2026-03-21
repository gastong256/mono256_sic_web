import { beforeEach, describe, expect, it } from 'vitest'
import {
  getUserByUsername,
  listCompaniesForUser,
  resetMockDb,
  setCourseDemoCompanyVisibility,
} from '@/mocks/data/mockDb'

describe('course demo visibility in mockDb', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('controls whether a student can see a published demo based on course visibility', () => {
    const teacher = getUserByUsername('teacher1')
    const student = getUserByUsername('student1')

    expect(teacher).not.toBeNull()
    expect(student).not.toBeNull()

    expect(listCompaniesForUser(student!).some((company) => company.id === 7)).toBe(true)

    const hidden = setCourseDemoCompanyVisibility(teacher!, 1, 7, false)
    expect(hidden.ok).toBe(true)
    expect(listCompaniesForUser(student!).some((company) => company.id === 7)).toBe(false)

    const shown = setCourseDemoCompanyVisibility(teacher!, 1, 7, true)
    expect(shown.ok).toBe(true)
    expect(listCompaniesForUser(student!).some((company) => company.id === 7)).toBe(true)
  })
})
