import type { Role, User } from '@/shared/types'
import { logger } from '@/shared/lib/logger'

const ROLE_SET: ReadonlySet<Role> = new Set(['admin', 'teacher', 'student'])

export function resolveEffectiveRole(user: User | null | undefined): Role {
  if (!user) return 'student'

  if (ROLE_SET.has(user.role)) return user.role

  // Fallback for inconsistent payloads while backend converges.
  if (user.is_staff) {
    logger.warn({
      message: 'User role missing/invalid for staff user, falling back to teacher',
      username: user.username,
      role: String(user.role),
    })
    return 'teacher'
  }

  logger.warn({
    message: 'User role missing/invalid for non-staff user, falling back to student',
    username: user.username,
    role: String(user.role),
  })
  return 'student'
}

export function hasRole(user: User | null | undefined, roles: Role[]): boolean {
  const role = resolveEffectiveRole(user)
  return roles.includes(role)
}

export function canManageCompany(user: User | null | undefined, ownerUsername: string): boolean {
  return user?.username === ownerUsername
}

export function canViewTeacherDashboard(user: User | null | undefined): boolean {
  return hasRole(user, ['teacher', 'admin'])
}

export function canManageRoles(user: User | null | undefined): boolean {
  return hasRole(user, ['admin'])
}
