import { useMe } from '@/features/auth/hooks/useMe'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { Spinner } from '@/shared/ui/Spinner'
import { getRequestId } from '@/shared/lib/tracing'
import { RegistrationCodeCard } from '@/features/auth/components/RegistrationCodeCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'

export function ProfilePage() {
  const { user } = useAuthStore()
  const { isLoading, isError } = useMe()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-[var(--brand-500)]" label="Loading profile..." />
      </div>
    )
  }

  if (isError || !user) {
    return <Alert tone="error">Failed to load profile. Please try refreshing the page.</Alert>
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username

  return (
    <div className="space-y-6">
      <PageHeader icon="profile" title="Perfil" subtitle="Tu informacion de cuenta." />

      {/* Profile card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Avatar header */}
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

        {/* Details */}
        <div className="divide-y divide-gray-100">
          <ProfileField label="Usuario" value={user.username} />
          <ProfileField label="Nombre completo" value={displayName} />
          <ProfileField label="Email" value={user.email} />
          {user.role && <ProfileField label="Rol" value={user.role} />}
          <ProfileField label="ID de usuario" value={String(user.id)} mono />
          <ProfileField label="Request ID de sesión" value={getRequestId()} mono />
        </div>
      </div>

      <RegistrationCodeCard />
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
