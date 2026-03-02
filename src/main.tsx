import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { App } from '@/app/App'
import { initSentry } from '@/shared/lib/sentry'
import { logger } from '@/shared/lib/logger'

// ── Initialize observability ──────────────────────────────────────────────────
initSentry()

// ── Conditionally start MSW (dev/mock mode only) ──────────────────────────────

async function enableMocking(): Promise<void> {
  /**
   * VITE_USE_MOCK_API is inlined at build time.
   * When false, this entire branch is dead code and tree-shaken
   * by Rollup — MSW will NOT be included in the production bundle.
   */
  if (import.meta.env.VITE_USE_MOCK_API !== 'true') return

  const { worker } = await import('@/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })

  logger.info({ message: 'MSW mock API active' })
}

// ── Boot ──────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found — check index.html')
}

enableMocking()
  .then(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((err: unknown) => {
    console.error('Failed to start application:', err)
  })
