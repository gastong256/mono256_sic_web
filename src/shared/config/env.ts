import { z } from 'zod'

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('App'),
  VITE_API_BASE_URL: z.string().min(1).default('http://localhost:8000/api/v1'),
  VITE_USE_MOCK_API: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  VITE_SENTRY_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_ENV: z.string().default('development'),
})

const _parsed = envSchema.safeParse(import.meta.env)

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:', _parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables — check your .env file against .env.example')
}

export const env = _parsed.data

export type Env = typeof env
