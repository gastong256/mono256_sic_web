import { Link, useLocation } from 'react-router'

export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="surface-card relative w-full max-w-xl overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(0,104,234,0.18),transparent_72%)]" />
        <p className="text-8xl font-black text-[var(--border-soft)] select-none sm:text-9xl">404</p>

        <div className="-mt-2">
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">Página no encontrada</h1>
          <p className="muted-text mt-2 text-sm">
            <span className="font-mono text-[var(--text-muted)]/80">{pathname}</span> no existe o ya
            no está disponible.
          </p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Ir al inicio
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}
