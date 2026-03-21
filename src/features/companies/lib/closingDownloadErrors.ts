import { isAxiosError } from 'axios'
import { extractApiMessage } from '@/shared/lib/httpErrors'

export function getClosingDownloadErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'No se pudo descargar el cierre confirmado.'

  const status = error.response?.status
  if (status === 400) return 'Parámetros inválidos para descargar el cierre confirmado.'
  if (status === 401) return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  if (status === 403) return 'No tenés permisos para descargar este cierre confirmado.'
  if (status === 404) return 'El cierre confirmado solicitado no existe o no está disponible.'
  if (status === 409) {
    return extractApiMessage(error) ?? 'No se pudo descargar este cierre confirmado.'
  }
  if (status === 503) return 'La descarga no está disponible temporalmente.'

  return 'No se pudo descargar el cierre confirmado.'
}
