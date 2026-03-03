import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { AxiosError } from 'axios'

interface QueryProviderProps {
  children: ReactNode
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined

  const maybeAxiosError = error as AxiosError
  if (typeof maybeAxiosError.response?.status === 'number') {
    return maybeAxiosError.response.status
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  return undefined
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Don't retry on 4xx client errors
            retry: (failureCount, error) => {
              const status = getErrorStatus(error)
              if (status !== undefined && status >= 400 && status < 500) {
                return false
              }
              return failureCount < 2
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
