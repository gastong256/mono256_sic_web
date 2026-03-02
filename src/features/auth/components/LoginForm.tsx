import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

// ── Validation schema ─────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginForm() {
  const { mutate: login, isPending, error, isError } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(values: LoginFormValues) {
    login(values)
  }

  const apiErrorMessage =
    isError && error instanceof Error ? error.message : isError ? 'Login failed. Please try again.' : null

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      aria-label="Login form"
    >
      {/* API-level error */}
      {apiErrorMessage && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {apiErrorMessage}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="user@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" isLoading={isPending} className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
