import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMe } from '@/features/auth/hooks/useMe'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { env } from '@/shared/config/env'
import { CompanySelector } from '@/features/companies/components/CompanySelector'
import { canManageRoles, canViewTeacherDashboard } from '@/shared/lib/authorization'

export function Layout() {
  const { accessToken, user } = useAuthStore()
  const [asientosOpen, setAsientosOpen] = useState(false)
  const [librosOpen, setLibrosOpen] = useState(false)
  useMe()
  const handleLogout = useLogout()
  const canViewTeacher = canViewTeacherDashboard(user)
  const canAssignRoles = canManageRoles(user)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Left: Logo + CompanySelector */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
            >
              {env.VITE_APP_NAME}
            </Link>
            <CompanySelector />
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            {accessToken ? (
              <>
                {/* Asientos dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAsientosOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setAsientosOpen(false), 150)}
                    className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Asientos
                    <svg
                      className={[
                        'size-3.5 transition-transform',
                        asientosOpen ? 'rotate-180' : '',
                      ].join(' ')}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {asientosOpen && (
                    <div className="absolute top-full right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        to="/"
                        onClick={() => setAsientosOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Registro manual
                      </Link>
                      <span
                        title="Próximamente"
                        className="block cursor-not-allowed px-4 py-2 text-sm text-gray-400 opacity-60 select-none"
                      >
                        Por operación
                      </span>
                      <span
                        title="Próximamente"
                        className="block cursor-not-allowed px-4 py-2 text-sm text-gray-400 opacity-60 select-none"
                      >
                        Por documento contable
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setLibrosOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setLibrosOpen(false), 150)}
                    className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Libros
                    <svg
                      className={[
                        'size-3.5 transition-transform',
                        librosOpen ? 'rotate-180' : '',
                      ].join(' ')}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {librosOpen && (
                    <div className="absolute top-full right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        to="/reports/journal-book"
                        onClick={() => setLibrosOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Libro Diario
                      </Link>
                      <Link
                        to="/reports/ledger"
                        onClick={() => setLibrosOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Libro Mayor
                      </Link>
                      <Link
                        to="/reports/trial-balance"
                        onClick={() => setLibrosOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Balance de comprobación
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/companies"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  Empresas
                </Link>
                <Link
                  to="/profile"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  Perfil
                </Link>
                {canViewTeacher && (
                  <>
                    <Link
                      to="/teacher/dashboard"
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      Panel docente
                    </Link>
                    <Link
                      to="/settings/chart-visibility"
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      Plan de cuentas
                    </Link>
                  </>
                )}
                {canAssignRoles && (
                  <Link
                    to="/admin/roles"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Roles
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
