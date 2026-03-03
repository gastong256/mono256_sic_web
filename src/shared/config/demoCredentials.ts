import type { Role } from '@/shared/types'

export interface DemoCredential {
  username: string
  password: string
  role: Role
  label?: string
}

// Keep this list in sync with src/mocks/data/mockDb.ts
export const DEMO_CREDENTIALS: DemoCredential[] = [
  { username: 'admin', password: 'password', role: 'admin', label: 'Administrador' },
  { username: 'teacher1', password: 'password', role: 'teacher', label: 'Docente' },
  { username: 'student1', password: 'password', role: 'student', label: 'Estudiante' },
  { username: 'student2', password: 'password', role: 'student', label: 'Estudiante' },
]
