import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMe } from '@/features/auth/hooks/useMe'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { env } from '@/shared/config/env'
import { CompanySelector } from '@/features/companies/components/CompanySelector'
import { canManageRoles, canViewTeacherDashboard } from '@/shared/lib/authorization'
import { AppBreadcrumbs } from '@/shared/ui/AppBreadcrumbs'

function navLinkClassName(isActive: boolean): string {
  return [
    'menu-pill text-sm font-semibold',
    isActive
      ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-[0_8px_20px_-18px_rgba(10,29,64,0.8)]'
      : '',
  ].join(' ')
}

export function Layout() {
  const { accessToken, user } = useAuthStore()
  const [asientosOpen, setAsientosOpen] = useState(false)
  const [librosOpen, setLibrosOpen] = useState(false)
  const [supervisionOpen, setSupervisionOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useMe()

  const handleLogout = useLogout()
  const canViewTeacher = canViewTeacherDashboard(user)
  const canAssignRoles = canManageRoles(user)
  const isAuthenticated = Boolean(accessToken)

  const showBreadcrumbs =
    isAuthenticated && pathname !== '/login' && pathname !== '/register' && pathname !== '/'

  function closeAllMenus() {
    setAsientosOpen(false)
    setLibrosOpen(false)
    setSupervisionOpen(false)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    closeAllMenus()
  }, [pathname])

  useEffect(() => {
    function onEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') closeAllMenus()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/"
              className="shrink-0 bg-[linear-gradient(120deg,var(--brand-600),var(--accent-500))] bg-clip-text text-lg font-bold tracking-tight text-transparent transition-opacity hover:opacity-85"
            >
              {env.VITE_APP_NAME}
            </Link>
            <div className="hidden sm:block">
              <CompanySelector />
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {accessToken ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setAsientosOpen((v) => !v)}
                    aria-expanded={asientosOpen}
                    aria-controls="menu-asientos"
                    className="menu-pill flex items-center gap-1 text-sm font-semibold"
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
                    <div
                      id="menu-asientos"
                      className="glass-panel absolute top-full right-0 z-20 mt-2 w-56 rounded-2xl py-1"
                    >
                      <NavLink
                        to="/"
                        className={({ isActive }) =>
                          [
                            'mx-1 block rounded-lg px-3 py-2 text-sm',
                            isActive
                              ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                              : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                          ].join(' ')
                        }
                      >
                        Registro manual
                      </NavLink>
                      <span
                        title="Proximamente"
                        className="block cursor-not-allowed px-4 py-2 text-sm text-[var(--text-muted)] opacity-60 select-none"
                      >
                        Por operacion
                      </span>
                      <span
                        title="Proximamente"
                        className="block cursor-not-allowed px-4 py-2 text-sm text-[var(--text-muted)] opacity-60 select-none"
                      >
                        Por documento contable
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setLibrosOpen((v) => !v)}
                    aria-expanded={librosOpen}
                    aria-controls="menu-libros"
                    className="menu-pill flex items-center gap-1 text-sm font-semibold"
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
                    <div
                      id="menu-libros"
                      className="glass-panel absolute top-full right-0 z-20 mt-2 w-56 rounded-2xl py-1"
                    >
                      <NavLink
                        to="/reports/journal-book"
                        className={({ isActive }) =>
                          [
                            'mx-1 block rounded-lg px-3 py-2 text-sm',
                            isActive
                              ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                              : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                          ].join(' ')
                        }
                      >
                        Libro Diario
                      </NavLink>
                      <NavLink
                        to="/reports/ledger"
                        className={({ isActive }) =>
                          [
                            'block px-4 py-2 text-sm',
                            isActive
                              ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                              : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                          ].join(' ')
                        }
                      >
                        Libro Mayor
                      </NavLink>
                      <NavLink
                        to="/reports/trial-balance"
                        className={({ isActive }) =>
                          [
                            'block px-4 py-2 text-sm',
                            isActive
                              ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                              : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                          ].join(' ')
                        }
                      >
                        Balance de comprobacion
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink to="/companies" className={({ isActive }) => navLinkClassName(isActive)}>
                  Empresas
                </NavLink>

                {canViewTeacher && (
                  <div className="relative">
                    <button
                      onClick={() => setSupervisionOpen((v) => !v)}
                      aria-expanded={supervisionOpen}
                      aria-controls="menu-supervision"
                      className="menu-pill flex items-center gap-1 text-sm font-semibold"
                    >
                      Supervision
                      <svg
                        className={[
                          'size-3.5 transition-transform',
                          supervisionOpen ? 'rotate-180' : '',
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
                    {supervisionOpen && (
                      <div
                        id="menu-supervision"
                        className="glass-panel absolute top-full right-0 z-20 mt-2 w-56 rounded-2xl py-1"
                      >
                        <NavLink
                          to="/teacher/dashboard"
                          className={({ isActive }) =>
                            [
                              'mx-1 block rounded-lg px-3 py-2 text-sm',
                              isActive
                                ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                                : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                            ].join(' ')
                          }
                        >
                          Panel docente
                        </NavLink>
                        <NavLink
                          to="/settings/chart-visibility"
                          className={({ isActive }) =>
                            [
                              'block px-4 py-2 text-sm',
                              isActive
                                ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                                : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                            ].join(' ')
                          }
                        >
                          Plan de cuentas
                        </NavLink>
                        {canAssignRoles && (
                          <NavLink
                            to="/admin/roles"
                            className={({ isActive }) =>
                              [
                                'block px-4 py-2 text-sm',
                                isActive
                                  ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                                  : 'text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                              ].join(' ')
                            }
                          >
                            Roles
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <NavLink to="/profile" className={({ isActive }) => navLinkClassName(isActive)}>
                  Perfil
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="menu-pill rounded-full border-[var(--border-strong)] bg-white text-sm font-semibold hover:bg-red-50 hover:text-red-700"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-[linear-gradient(120deg,var(--brand-500),var(--brand-600))] px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-105"
              >
                Iniciar sesion
              </Link>
            )}
          </div>

          {accessToken && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              Menu
              <svg
                className={['size-4 transition-transform', mobileMenuOpen ? 'rotate-180' : ''].join(
                  ' '
                )}
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
          )}
        </div>

        {accessToken && mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="glass-panel mx-auto mt-2 max-w-6xl rounded-2xl border-t border-[var(--border-soft)] px-4 py-3 md:hidden"
          >
            <div className="mb-3 block sm:hidden">
              <CompanySelector />
            </div>
            <div className="grid gap-2">
              <NavLink to="/" className={({ isActive }) => navLinkClassName(isActive)}>
                Asientos
              </NavLink>
              <NavLink to="/companies" className={({ isActive }) => navLinkClassName(isActive)}>
                Empresas
              </NavLink>
              <NavLink
                to="/reports/journal-book"
                className={({ isActive }) => navLinkClassName(isActive)}
              >
                Libro Diario
              </NavLink>
              <NavLink
                to="/reports/ledger"
                className={({ isActive }) => navLinkClassName(isActive)}
              >
                Libro Mayor
              </NavLink>
              <NavLink
                to="/reports/trial-balance"
                className={({ isActive }) => navLinkClassName(isActive)}
              >
                Balance de comprobacion
              </NavLink>

              {canViewTeacher && (
                <>
                  <NavLink
                    to="/teacher/dashboard"
                    className={({ isActive }) => navLinkClassName(isActive)}
                  >
                    Panel docente
                  </NavLink>
                  <NavLink
                    to="/settings/chart-visibility"
                    className={({ isActive }) => navLinkClassName(isActive)}
                  >
                    Plan de cuentas
                  </NavLink>
                </>
              )}

              {canAssignRoles && (
                <NavLink to="/admin/roles" className={({ isActive }) => navLinkClassName(isActive)}>
                  Roles
                </NavLink>
              )}

              <NavLink to="/profile" className={({ isActive }) => navLinkClassName(isActive)}>
                Perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 text-left text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-700"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {showBreadcrumbs && <AppBreadcrumbs />}
        <Outlet />
      </main>
    </div>
  )
}
