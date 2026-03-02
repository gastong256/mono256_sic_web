import { Link } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { env } from '@/shared/config/env'

const FEATURES = [
  { icon: '⚛️', label: 'React 19', desc: 'Latest React with concurrent features' },
  { icon: '⚡', label: 'Vite 6', desc: 'Instant HMR, optimized builds' },
  { icon: '🎨', label: 'Tailwind v4', desc: 'CSS-first, zero-config setup' },
  { icon: '🔐', label: 'Auth + JWT', desc: 'Access token in memory, refresh in storage' },
  { icon: '🔄', label: 'TanStack Query', desc: 'Async state, caching, background refetch' },
  { icon: '📋', label: 'React Hook Form', desc: 'Performant forms with Zod validation' },
  { icon: '🧪', label: 'Vitest + RTL', desc: 'Fast unit tests with Testing Library' },
  { icon: '🎭', label: 'Playwright', desc: 'Reliable end-to-end tests' },
  { icon: '🎭', label: 'MSW v2', desc: 'API mocking in browser and tests' },
] as const

export function HomePage() {
  const { accessToken, user } = useAuthStore()

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-8 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {env.VITE_APP_NAME}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            A production-ready React template. Feature-first architecture, strict TypeScript,
            full auth flow, and a complete test suite — ready to ship.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {accessToken ? (
              <>
                <p className="text-sm text-gray-500">
                  Signed in as{' '}
                  <strong className="font-medium text-gray-700">{user?.name ?? 'User'}</strong>
                </p>
                <Link
                  to="/items"
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  View items →
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Get started
                </Link>
                <Link
                  to="/items"
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  View demo
                </Link>
              </>
            )}
          </div>

          {env.VITE_USE_MOCK_API && (
            <p className="mt-4 text-xs text-blue-500">
              Running with mock API —{' '}
              <strong>user@example.com</strong> / <strong>password</strong>
            </p>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section>
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-700">
          Everything you need, already wired up
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <span className="text-2xl" role="img" aria-label={label}>
                {icon}
              </span>
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick start */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-3 font-semibold text-gray-800">Quick start</h2>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
          <code>{`git clone https://github.com/__OWNER__/react-vite-ts-tailwind-base
cd react-vite-ts-tailwind-base
pnpm run init   # replace placeholders
pnpm install
pnpm dev`}</code>
        </pre>
      </section>
    </div>
  )
}
