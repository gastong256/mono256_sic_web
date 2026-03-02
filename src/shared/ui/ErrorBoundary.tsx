import type { ReactNode } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { getRequestId } from '@/shared/lib/tracing'
import { logger } from '@/shared/lib/logger'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const requestId = getRequestId()

  return (
    <div
      role="alert"
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-xl">
            ⚠️
          </span>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>

        <div className="mb-6 rounded-md bg-gray-50 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Request ID (include when contacting support)
          </p>
          <p className="break-all font-mono text-xs text-gray-700">{requestId}</p>
        </div>

        <button
          onClick={resetErrorBoundary}
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function onError(error: Error, info: { componentStack?: string | null }): void {
  logger.error({
    message: 'React ErrorBoundary caught an error',
    error: error.message,
    stack: error.stack,
    componentStack: info.componentStack ?? '',
  })
}

interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

export function ErrorBoundary({ children, onReset }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={onError}
      onReset={onReset}
    >
      {children}
    </ReactErrorBoundary>
  )
}
