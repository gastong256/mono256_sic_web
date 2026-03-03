import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// ── Validation schema ─────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginForm() {
  const { mutate: login, isPending, isError } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  function onSubmit(values: LoginFormValues) {
    login(values)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      aria-label="Formulario de inicio de sesión"
    >
      {/* API-level error */}
      {isError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger-600)]"
        >
          Usuario o contraseña incorrectos.
        </div>
      )}

      <Input
        label="Usuario"
        type="text"
        autoComplete="username"
        autoFocus
        error={errors.username?.message}
        {...register('username')}
      />

      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" isLoading={isPending} className="w-full">
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
