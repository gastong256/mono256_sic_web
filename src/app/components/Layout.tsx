import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMe } from '@/features/auth/hooks/useMe'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { CompanySelector } from '@/features/companies/components/CompanySelector'
import { canManageRoles, canViewTeacherDashboard } from '@/shared/lib/authorization'
import { AppBreadcrumbs } from '@/shared/ui/AppBreadcrumbs'
import { BrandMark } from '@/shared/ui/BrandMark'

function navLinkClassName(isActive: boolean): string {
  return [
    'menu-pill',
    isActive
      ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-[0_8px_20px_-18px_rgba(10,29,64,0.8)]'
      : '',
  ].join(' ')
}

function navDropdownItemClassName(isActive: boolean): string {
  return [
    'menu-dropdown-item',
    isActive ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]' : '',
  ].join(' ')
}

export function Layout() {
  const { accessToken, user } = useAuthStore()
  const [asientosOpen, setAsientosOpen] = useState(false)
  const [librosOpen, setLibrosOpen] = useState(false)
  const [supervisionOpen, setSupervisionOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

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
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="glass-panel mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 sm:h-[4.25rem]">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/"
              className="flex h-full shrink-0 items-center transition-opacity hover:opacity-90"
            >
              <BrandMark variant="horizontal" className="hidden h-[3.35rem] w-[13.6rem] sm:block" />
              <BrandMark variant="icon" className="size-9 sm:hidden" />
            </Link>
            <div className="hidden xl:block">
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
                    className="menu-pill gap-1"
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
                        className={({ isActive }) => navDropdownItemClassName(isActive)}
                      >
                        Registro manual
                      </NavLink>
                      <span
                        title="Proximamente"
                        className="menu-dropdown-item cursor-not-allowed text-[var(--text-muted)] opacity-60 select-none"
                      >
                        Por operacion
                      </span>
                      <span
                        title="Proximamente"
                        className="menu-dropdown-item cursor-not-allowed text-[var(--text-muted)] opacity-60 select-none"
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
                    className="menu-pill gap-1"
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
                        className={({ isActive }) => navDropdownItemClassName(isActive)}
                      >
                        Libro Diario
                      </NavLink>
                      <NavLink
                        to="/reports/ledger"
                        className={({ isActive }) => navDropdownItemClassName(isActive)}
                      >
                        Libro Mayor
                      </NavLink>
                      <NavLink
                        to="/reports/trial-balance"
                        className={({ isActive }) => navDropdownItemClassName(isActive)}
                      >
                        Balance de comprobacion
                      </NavLink>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/companies')}
                  className={[
                    'menu-pill gap-1',
                    pathname.startsWith('/companies')
                      ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-[0_8px_20px_-18px_rgba(10,29,64,0.8)]'
                      : '',
                  ].join(' ')}
                >
                  Empresas
                </button>

                {canViewTeacher && (
                  <div className="relative">
                    <button
                      onClick={() => setSupervisionOpen((v) => !v)}
                      aria-expanded={supervisionOpen}
                      aria-controls="menu-supervision"
                      className="menu-pill gap-1"
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
                          className={({ isActive }) => navDropdownItemClassName(isActive)}
                        >
                          Panel docente
                        </NavLink>
                        <NavLink
                          to="/settings/chart-visibility"
                          className={({ isActive }) => navDropdownItemClassName(isActive)}
                        >
                          Plan de cuentas
                        </NavLink>
                        {canAssignRoles && (
                          <NavLink
                            to="/admin/roles"
                            className={({ isActive }) => navDropdownItemClassName(isActive)}
                          >
                            Roles
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate('/profile')}
                  className={[
                    'menu-pill gap-1',
                    pathname.startsWith('/profile')
                      ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-[0_8px_20px_-18px_rgba(10,29,64,0.8)]'
                      : '',
                  ].join(' ')}
                >
                  Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-full border border-red-200 bg-[linear-gradient(120deg,#fff5f5,#ffe9e9)] px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-[linear-gradient(120deg,#ffe9e9,#ffdede)]"
                >
                  Salir
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

        {accessToken && (
          <div className="mx-auto mt-2 hidden max-w-6xl md:block xl:hidden">
            <div className="glass-panel rounded-2xl px-3 py-2">
              <CompanySelector />
            </div>
          </div>
        )}

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
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-[linear-gradient(120deg,#fff5f5,#ffe9e9)] px-3 py-2 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-[linear-gradient(120deg,#ffe9e9,#ffdede)]"
              >
                <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M7.5 3.5a.75.75 0 0 1 1.5 0v5.75a.75.75 0 0 1-1.5 0V3.5Zm-2.8 1.17a.75.75 0 0 1 1.06 0l.92.92a.75.75 0 0 1-1.06 1.06l-.9-.9A5.25 5.25 0 1 0 14 5.7l-.9.9a.75.75 0 0 1-1.06-1.06l.9-.9a.75.75 0 0 1 1.06 0 6.75 6.75 0 1 1-9.3.03Z"
                    clipRule="evenodd"
                  />
                </svg>
                Salir
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {showBreadcrumbs && <AppBreadcrumbs />}
        <Outlet />
      </main>

      <footer className="mt-4 border-t border-[var(--border-soft)]/80 bg-white/45 px-4 py-4 backdrop-blur-[1px]">
        <div className="mx-auto flex w-full max-w-6xl justify-end">
          <div className="space-y-1 text-left text-xs text-[var(--text-muted)]">
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]/75">
              <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm1 4a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Simulador con fines educativos</span>
            </p>
            <div className="space-y-0 text-left">
              <p className="text-[0.78rem]">
                Inspired by{' '}
                <span className="font-semibold text-[var(--text-strong)]">
                  SIC - Sistemas de Informacion Contable
                </span>
              </p>
              <p className="text-[0.72rem] text-[var(--text-muted)]/95 italic">
                Angrisani Editores - Ed. 2019
              </p>
            </div>
            <p className="text-[0.8rem]">
              Developed by{' '}
              <a
                href="https://github.com/gastong256/mono256_sic_web"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[var(--text-strong)] hover:text-[var(--brand-700)]"
              >
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.2c-3.35.73-4.06-1.61-4.06-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.08 1.84 2.82 1.31 3.5 1 .1-.78.42-1.31.76-1.62-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.39 1.23-3.23-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.28 1.23a11.37 11.37 0 0 1 5.97 0c2.27-1.55 3.27-1.23 3.27-1.23.66 1.65.25 2.87.13 3.17.77.84 1.23 1.92 1.23 3.23 0 4.61-2.8 5.63-5.48 5.93.43.38.82 1.11.82 2.24v3.32c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
                </svg>
                <span>gastong256</span>
              </a>{' '}
              at{' '}
              <a
                href="https://www.linkedin.com/in/gastongonzalez256/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
              >
                LinkedIn
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
