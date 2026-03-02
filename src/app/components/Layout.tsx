import { Link, Outlet, useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { env } from '@/shared/config/env'

export function Layout() {
  const { accessToken, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    void navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link
            to="/"
            className="text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
          >
            {env.VITE_APP_NAME}
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-gray-600 transition-colors hover:text-gray-900">
              Home
            </Link>

            {accessToken ? (
              <>
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
