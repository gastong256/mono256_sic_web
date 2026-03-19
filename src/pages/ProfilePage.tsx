import { useEffect, useMemo, useState } from 'react'
import { useAuthenticatedBootstrap } from '@/features/auth/hooks/useAuthenticatedBootstrap'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { Spinner } from '@/shared/ui/Spinner'
import { getRequestId } from '@/shared/lib/tracing'
import { RegistrationCodeCard } from '@/features/auth/components/RegistrationCodeCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import {
  extractApiMessage,
  extractFieldValidationErrors,
  getHttpErrorMessage,
} from '@/shared/lib/httpErrors'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useUpdateMe } from '@/features/auth/hooks/useUpdateMe'
import { useToast } from '@/shared/ui/ToastProvider'

export function ProfilePage() {
  const { pushToast } = useToast()
  const storedUser = useAuthStore((state) => state.user)
  const { data: bootstrapUser, isLoading, isError, error } = useAuthenticatedBootstrap()
  const updateMeMutation = useUpdateMe()
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState({
    email: '',
    first_name: '',
    last_name: '',
  })
  const [formErrors, setFormErrors] = useState<
    Partial<Record<'email' | 'first_name' | 'last_name', string>>
  >({})
  const [formGenericError, setFormGenericError] = useState<string | null>(null)

  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar tu perfil.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      }),
    [error]
  )
  const user = bootstrapUser ?? storedUser

  useEffect(() => {
    if (!user) return
    setFormValues({
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
    })
  }, [user])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-[var(--brand-500)]" label="Loading profile..." />
      </div>
    )
  }

  if (isError || !user) {
    return <Alert tone="error">{loadErrorMessage}</Alert>
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username

  async function handleProfileSave() {
    setFormErrors({})
    setFormGenericError(null)

    try {
      await updateMeMutation.mutateAsync({
        email: formValues.email || undefined,
        first_name: formValues.first_name || undefined,
        last_name: formValues.last_name || undefined,
      })
      pushToast('Perfil actualizado correctamente.', 'success')
      setIsEditing(false)
    } catch (updateError) {
      const fieldErrors = extractFieldValidationErrors(updateError)
      setFormErrors({
        ...(fieldErrors.email ? { email: fieldErrors.email } : null),
        ...(fieldErrors.first_name ? { first_name: fieldErrors.first_name } : null),
        ...(fieldErrors.last_name ? { last_name: fieldErrors.last_name } : null),
      })
      if (!Object.keys(fieldErrors).length) {
        setFormGenericError(extractApiMessage(updateError) ?? 'No se pudo actualizar el perfil.')
      }
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="profile"
        title="Perfil"
        subtitle="Gestioná tus datos de acceso y revisá la información operativa de tu cuenta."
        actions={
          !isEditing ? (
            <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
              Editar perfil
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-3 md:grid-cols-4">
        <article className="summary-stat-card">
          <p className="summary-stat-label">Usuario</p>
          <p className="summary-stat-value text-[0.95rem]">@{user.username}</p>
        </article>
        <article className="summary-stat-card">
          <p className="summary-stat-label">Rol</p>
          <p className="summary-stat-value text-[0.95rem]">{user.role || 'Sin rol'}</p>
        </article>
        <article className="summary-stat-card">
          <p className="summary-stat-label">Email</p>
          <p className="summary-stat-value text-[0.95rem]">{user.email || 'Sin email'}</p>
        </article>
        <article className="summary-stat-card">
          <p className="summary-stat-label">Sesión</p>
          <p className="summary-stat-value text-[0.95rem]">ID #{user.id}</p>
        </article>
      </section>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{displayName}</p>
              <p className="text-sm text-blue-100">{user.email}</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-4 border-b border-gray-100 px-6 py-4">
            {formGenericError && <Alert tone="error">{formGenericError}</Alert>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nombre"
                value={formValues.first_name}
                error={formErrors.first_name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, first_name: event.target.value }))
                }
              />
              <Input
                label="Apellido"
                value={formValues.last_name}
                error={formErrors.last_name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, last_name: event.target.value }))
                }
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formValues.email}
              error={formErrors.email}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, email: event.target.value }))
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={updateMeMutation.isPending}
                onClick={() => {
                  setIsEditing(false)
                  setFormErrors({})
                  setFormGenericError(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                isLoading={updateMeMutation.isPending}
                onClick={() => {
                  void handleProfileSave()
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          <ProfileField label="Usuario" value={user.username} />
          <ProfileField label="Nombre completo" value={displayName} />
          <ProfileField label="Email" value={user.email} />
          {user.role && <ProfileField label="Rol" value={user.role} />}
          <ProfileField label="ID de usuario" value={String(user.id)} mono />
          <ProfileField label="Request ID de sesión" value={getRequestId()} mono />
        </div>
      </div>

      <RegistrationCodeCard data={user.registration_code} isLoading={isLoading} isError={isError} />
    </div>
  )
}

function ProfileField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between px-6 py-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-sm text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
