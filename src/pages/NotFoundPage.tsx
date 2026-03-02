import { Link, useLocation } from 'react-router'

export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      {/* Large 404 */}
      <p className="text-9xl font-black text-gray-100 select-none">404</p>

      <div className="-mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-mono text-gray-400">{pathname}</span> doesn&apos;t exist.
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go back
        </button>
      </div>
    </div>
  )
}
