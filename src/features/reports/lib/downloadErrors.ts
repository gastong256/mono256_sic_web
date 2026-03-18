import { isAxiosError } from 'axios'
import { extractApiMessage } from '@/shared/lib/httpErrors'

export function getReportDownloadErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'No se pudo descargar el archivo Excel.'

  const status = error.response?.status
  if (status === 400) return 'Parámetros inválidos para exportar el reporte.'
  if (status === 401) return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  if (status === 403) return 'No tenés permisos para descargar este reporte.'
  if (status === 404) return 'La empresa no existe o no está disponible.'
  if (status === 409) {
    return (
      extractApiMessage(error) ??
      'La empresa no puede exportar este reporte por su estado contable o por el período solicitado.'
    )
  }
  if (status === 503) return 'La exportación no está disponible temporalmente.'

  return 'No se pudo descargar el archivo Excel.'
}
