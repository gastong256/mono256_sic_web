import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useRegister } from '@/features/auth/hooks/useRegister'
import type { RegisterPayload } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { Alert } from '@/shared/ui/Alert'
import { BrandMark } from '@/shared/ui/BrandMark'

const registerSchema = z
  .object({
    username: z.string().min(1, 'El usuario es obligatorio'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
    password_confirm: z.string().min(1, 'La confirmación es obligatoria'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    registration_code: z.string().min(1, 'El código de registro es obligatorio'),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirm'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>
type ServerErrors = Partial<Record<keyof RegisterPayload, string>>

export function RegisterPage() {
  const navigate = useNavigate()
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken ?? state.refreshToken))
  const [serverErrors, setServerErrors] = useState<ServerErrors>({})
  const [genericError, setGenericError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [retryAfterSec, setRetryAfterSec] = useState<number>(0)

  const { mutateAsync: registerUser, isPending } = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      password_confirm: '',
      email: '',
      first_name: '',
      last_name: '',
      registration_code: '',
    },
  })

  useEffect(() => {
    if (retryAfterSec <= 0) return
    const id = window.setInterval(() => {
      setRetryAfterSec((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [retryAfterSec])

  const blocked = retryAfterSec > 0
  const blockLabel = useMemo(
    () => (blocked ? `Demasiados intentos. Reintentá en ${retryAfterSec}s.` : null),
    [blocked, retryAfterSec]
  )

  async function onSubmit(values: RegisterFormValues) {
    setServerErrors({})
    setGenericError(null)
    setSuccess(false)

    try {
      await registerUser(values)
      setSuccess(true)
    } catch (error) {
      if (!isAxiosError(error)) {
        setGenericError('No se pudo completar el registro.')
        return
      }

      if (error.response?.status === 429) {
        const data = error.response.data as { retry_after?: number; detail?: string } | undefined
        const retryAfter = Number(data?.retry_after)
        setRetryAfterSec(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 10)
        setGenericError('Demasiados intentos. Esperá antes de volver a intentar.')
        return
      }

      if (error.response?.status === 400) {
        const data = error.response.data as Record<string, string[] | string> | undefined
        if (data) {
          const nextFieldErrors: ServerErrors = {}
          ;(['username', 'password', 'password_confirm', 'registration_code'] as const).forEach(
            (field) => {
              const value = data[field]
              if (Array.isArray(value) && value.length > 0) nextFieldErrors[field] = value[0]
              if (typeof value === 'string') nextFieldErrors[field] = value
            }
          )
          setServerErrors(nextFieldErrors)
          if (!Object.keys(nextFieldErrors).length) {
            setGenericError('No se pudo completar el registro.')
          }
          return
        }
      }

      setGenericError('No se pudo completar el registro.')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="surface-card p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3">
              <BrandMark
                variant="horizontal"
                className="mx-auto block h-16 w-[18.5rem] max-w-full"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
              Crear cuenta
            </h1>
            <p className="muted-text mt-1 text-sm">Registro de estudiante</p>
          </div>

          {success && (
            <Alert tone="success" className="mb-4">
              Usuario creado correctamente.
              <button
                type="button"
                className="ml-2 font-medium underline"
                onClick={() => navigate('/login', { replace: true })}
              >
                Ir a login
              </button>
            </Alert>
          )}

          {(genericError || blockLabel) && (
            <Alert tone="error" className="mb-4">
              {blockLabel ?? genericError}
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
            noValidate
          >
            <Input
              label="Usuario"
              autoComplete="username"
              error={errors.username?.message ?? serverErrors.username}
              {...register('username')}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message ?? serverErrors.password}
              {...register('password')}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.password_confirm?.message ?? serverErrors.password_confirm}
              {...register('password_confirm')}
            />
            <Input
              label="Email (opcional)"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input label="Nombre (opcional)" {...register('first_name')} />
            <Input label="Apellido (opcional)" {...register('last_name')} />
            <Input
              label="Código de registro"
              error={errors.registration_code?.message ?? serverErrors.registration_code}
              {...register('registration_code')}
            />

            <Button type="submit" className="w-full" isLoading={isPending} disabled={blocked}>
              Registrarme
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
