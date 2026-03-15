import { httpClient } from '@/shared/lib/http'
import type {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '@/features/accounts/types/account.types'

type AccountNodePayload = {
  id?: number
  code?: string
  name?: string
  type?: string
  level?: number
  is_leaf?: boolean
  children?: AccountNodePayload[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeAccountNode(node: AccountNodePayload, treeLevel: number): Account | null {
  const id = Number(node.id)
  if (!Number.isFinite(id) || id <= 0 || !node.code || !node.name || !node.type) return null

  const explicitLevel = Number(node.level)
  const level = Number.isFinite(explicitLevel) ? explicitLevel : treeLevel

  const children = (node.children ?? [])
    .map((child) => normalizeAccountNode(child, treeLevel + 1))
    .filter((child): child is Account => child !== null)

  return {
    id,
    code: node.code,
    name: node.name,
    type: node.type,
    level,
    is_leaf: typeof node.is_leaf === 'boolean' ? node.is_leaf : children.length === 0,
    children,
  }
}

function extractAccountNodes(payload: unknown): AccountNodePayload[] {
  if (Array.isArray(payload)) return payload as AccountNodePayload[]
  if (isRecord(payload) && Array.isArray(payload.results)) {
    return payload.results as AccountNodePayload[]
  }
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as AccountNodePayload[]
  }
  return []
}

function normalizeAccountTree(payload: unknown): Account[] {
  return extractAccountNodes(payload)
    .map((node) => normalizeAccountNode(node, 0))
    .filter((node): node is Account => node !== null)
}

export const accountsApi = {
  getChart: (): Promise<Account[]> =>
    httpClient.get<unknown>('/accounts/chart/').then((r) => normalizeAccountTree(r.data)),

  getCompanyAccounts: (companyId: number): Promise<Account[]> =>
    httpClient
      .get<unknown>(`/accounts/company/${companyId}/`)
      .then((r) => normalizeAccountTree(r.data)),

  createAccount: (companyId: number, payload: CreateAccountPayload): Promise<Account> => {
    if (!payload.parent_id || payload.parent_id <= 0) {
      return Promise.reject(new Error('Debe seleccionar una cuenta padre válida.'))
    }
    return httpClient.post<unknown>(`/accounts/company/${companyId}/`, payload).then((r) => {
      const normalized = normalizeAccountNode(r.data as AccountNodePayload, 2)
      if (!normalized) throw new Error('Respuesta inválida al crear la cuenta.')
      return normalized
    })
  },

  updateAccount: (
    companyId: number,
    accountId: number,
    payload: UpdateAccountPayload
  ): Promise<Account> =>
    httpClient.patch<unknown>(`/accounts/company/${companyId}/${accountId}/`, payload).then((r) => {
      const normalized = normalizeAccountNode(r.data as AccountNodePayload, 2)
      if (!normalized) throw new Error('Respuesta inválida al actualizar la cuenta.')
      return normalized
    }),

  deleteAccount: (companyId: number, accountId: number): Promise<void> =>
    httpClient.delete(`/accounts/company/${companyId}/${accountId}/`).then(() => undefined),
}
