import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/auth/store/auth.store'

export function LoginPage() {
  const { accessToken, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const isAuthenticated = Boolean(accessToken ?? refreshToken)

  // Redirect already-authenticated users away from the login page.
  // Check refreshToken too: accessToken is memory-only and lost on page reload,
  // but refreshToken is persisted in localStorage.
  useEffect(() => {
    if (isAuthenticated) {
      void navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
            <p className="mt-1 text-sm text-gray-500">Iniciá sesión en tu cuenta</p>
          </div>

          <LoginForm />

          {/* Mock hint */}
          {import.meta.env.VITE_USE_MOCK_API === 'true' && (
            <p className="mt-6 rounded-md bg-blue-50 px-3 py-2 text-center text-xs text-blue-600">
              Modo mock — usá <strong className="font-medium">admin</strong> /{' '}
              <strong className="font-medium">password</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
