import * as Sentry from '@sentry/react'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'

export function initSentry(): void {
  if (!env.VITE_SENTRY_ENABLED) {
    logger.debug({ message: 'Sentry disabled (VITE_SENTRY_ENABLED=false)' })
    return
  }

  if (!env.VITE_SENTRY_DSN) {
    logger.warn({ message: 'Sentry enabled but VITE_SENTRY_DSN is not set — skipping init' })
    return
  }

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: env.VITE_ENV === 'production' ? 0.2 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })

  logger.info({ message: 'Sentry initialized', environment: env.VITE_ENV })
}
