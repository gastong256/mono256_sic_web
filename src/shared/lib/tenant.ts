const TENANT_STORAGE_KEYS = ['tenant_id', 'tenant-id'] as const

function readStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null

  const fromLocalStorage = window.localStorage.getItem(key)
  if (typeof fromLocalStorage === 'string' && fromLocalStorage.trim().length > 0) {
    return fromLocalStorage.trim()
  }

  const fromSessionStorage = window.sessionStorage.getItem(key)
  if (typeof fromSessionStorage === 'string' && fromSessionStorage.trim().length > 0) {
    return fromSessionStorage.trim()
  }

  return null
}

export function getTenantId(): string | null {
  for (const key of TENANT_STORAGE_KEYS) {
    const value = readStorageValue(key)
    if (value) return value
  }
  return null
}
