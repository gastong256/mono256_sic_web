import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  useRegistrationCode,
  useRotateRegistrationCode,
} from '@/features/auth/hooks/useRegistrationCode'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'

function formatRemaining(seconds: number): string {
  const safe = Math.max(0, seconds)
  const min = Math.floor(safe / 60)
  const sec = safe % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function RegistrationCodeCard() {
  const role = useAuthStore((state) => state.user?.role)
  const canSee = role === 'teacher' || role === 'admin'
  const canRotate = role === 'admin'

  const { data, isLoading, isError } = useRegistrationCode()
  const { mutateAsync: rotateCode, isPending: rotating } = useRotateRegistrationCode()

  const [showConfirm, setShowConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [remainingSec, setRemainingSec] = useState<number>(0)

  useEffect(() => {
    if (!data?.valid_until) {
      setRemainingSec(0)
      return
    }

    const compute = () => {
      const delta = Math.floor((new Date(data.valid_until).getTime() - Date.now()) / 1000)
      setRemainingSec(Math.max(0, delta))
    }
    compute()
    const id = window.setInterval(compute, 1000)
    return () => window.clearInterval(id)
  }, [data?.valid_until])

  const expiryText = formatRemaining(remainingSec)

  if (!canSee) return null

  const expired = remainingSec <= 0

  async function handleCopy() {
    if (!data?.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setFeedback('No se pudo copiar el código.')
      setTimeout(() => setFeedback(null), 2500)
    }
  }

  async function handleRotate() {
    try {
      await rotateCode()
      setFeedback('Código rotado correctamente.')
      setTimeout(() => setFeedback(null), 2500)
    } catch {
      setFeedback('No se pudo rotar el código.')
      setTimeout(() => setFeedback(null), 2500)
    } finally {
      setShowConfirm(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Código de registro</h2>
          <p className="text-sm text-gray-500">
            Compartilo con estudiantes para que puedan registrarse.
          </p>
        </div>
        {canRotate && (
          <Button variant="secondary" onClick={() => setShowConfirm(true)}>
            Rotar ahora
          </Button>
        )}
      </div>

      {isLoading && <p className="mt-3 text-sm text-gray-500">Cargando código…</p>}
      {isError && !isLoading && (
        <p className="mt-3 text-sm text-red-600">No se pudo cargar el código de registro.</p>
      )}

      {!isLoading && !isError && data && (
        <div className="mt-3 space-y-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs tracking-wide text-gray-500 uppercase">Código actual</p>
            <p className="font-mono text-xl font-semibold text-gray-900">{data.code}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Vigencia:</span>
            <span className={expired ? 'font-medium text-red-600' : 'font-medium text-emerald-700'}>
              {expired ? 'Expirado' : `${expiryText} restantes`}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Ventana: {data.window_minutes} min · Válido desde{' '}
            {new Date(data.valid_from).toLocaleString('es-AR')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
            {feedback && <span className="text-sm text-gray-600">{feedback}</span>}
          </div>
        </div>
      )}

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Rotar código de registro"
      >
        <p className="text-sm text-gray-700">Esto invalida el código actual. ¿Querés continuar?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void handleRotate()} isLoading={rotating}>
            Confirmar rotación
          </Button>
        </div>
      </Modal>
    </section>
  )
}
