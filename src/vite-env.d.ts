/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK_API: string
  readonly VITE_SENTRY_ENABLED: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
