import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { DEMO_CREDENTIALS } from '@/shared/config/demoCredentials'
import { env } from '@/shared/config/env'

export function LoginPage() {
  const { accessToken, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const isAuthenticated = Boolean(accessToken ?? refreshToken)
  const showDemoCredentials = env.VITE_USE_MOCK_API && env.VITE_MOCK_SCENARIO === 'demo'

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
        <div className="surface-card p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
              Bienvenido
            </h1>
            <p className="muted-text mt-1 text-sm">Iniciá sesión en tu cuenta</p>
          </div>

          <LoginForm />
          <p className="muted-text mt-4 text-center text-sm">
            ¿No tenés cuenta?{' '}
            <Link
              to="/register"
              className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
            >
              Registrate
            </Link>
          </p>

          {showDemoCredentials && (
            <div className="subtle-panel mt-6 p-3">
              <p className="mb-2 text-xs font-semibold text-[var(--text-strong)]">
                Credenciales demo
              </p>
              <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                {DEMO_CREDENTIALS.map((credential) => (
                  <li key={credential.username} className="rounded bg-white/85 px-2 py-1">
                    <span className="font-medium">{credential.username}</span> /{' '}
                    <span className="font-medium">{credential.password}</span> (
                    {credential.label ?? credential.role})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
