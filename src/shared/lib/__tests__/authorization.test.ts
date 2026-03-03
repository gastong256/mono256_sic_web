import { describe, expect, it } from 'vitest'
import {
  canManageCompany,
  canManageRoles,
  canViewTeacherDashboard,
  hasRole,
  resolveEffectiveRole,
} from '@/shared/lib/authorization'
import type { User } from '@/shared/types'

const student: User = {
  id: 1,
  username: 'student1',
  email: 's1@example.com',
  first_name: 'S1',
  last_name: 'L1',
  is_staff: false,
  role: 'student',
}

const teacher: User = {
  id: 2,
  username: 'teacher1',
  email: 't1@example.com',
  first_name: 'T1',
  last_name: 'L1',
  is_staff: true,
  role: 'teacher',
}

const admin: User = {
  id: 3,
  username: 'admin',
  email: 'a@example.com',
  first_name: 'Admin',
  last_name: 'L1',
  is_staff: true,
  role: 'admin',
}

describe('authorization', () => {
  it('resolveEffectiveRole returns explicit role when valid', () => {
    expect(resolveEffectiveRole(student)).toBe('student')
    expect(resolveEffectiveRole(teacher)).toBe('teacher')
    expect(resolveEffectiveRole(admin)).toBe('admin')
  })

  it('hasRole works with multiple allowed roles', () => {
    expect(hasRole(teacher, ['teacher', 'admin'])).toBe(true)
    expect(hasRole(student, ['teacher', 'admin'])).toBe(false)
  })

  it('canViewTeacherDashboard allows teacher and admin', () => {
    expect(canViewTeacherDashboard(student)).toBe(false)
    expect(canViewTeacherDashboard(teacher)).toBe(true)
    expect(canViewTeacherDashboard(admin)).toBe(true)
  })

  it('canManageRoles allows only admin', () => {
    expect(canManageRoles(student)).toBe(false)
    expect(canManageRoles(teacher)).toBe(false)
    expect(canManageRoles(admin)).toBe(true)
  })

  it('canManageCompany allows teacher/admin and owner student only', () => {
    expect(canManageCompany(student, 'student1')).toBe(true)
    expect(canManageCompany(student, 'student2')).toBe(false)
    expect(canManageCompany(teacher, 'student2')).toBe(false)
    expect(canManageCompany(admin, 'student2')).toBe(false)
  })
})
