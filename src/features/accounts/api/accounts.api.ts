import { httpClient } from '@/shared/lib/http'
import { extractListPayload } from '@/shared/lib/apiPagination'
import type {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '@/features/accounts/types/account.types'
import { isRecord } from '@/shared/lib/valueParsers'

type AccountNodePayload = {
  id?: number
  code?: string
  name?: string
  type?: string
  level?: number
  is_leaf?: boolean
  children?: AccountNodePayload[]
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
  return extractListPayload<AccountNodePayload>(payload)
}

function normalizeAccountTree(payload: unknown): Account[] {
  return extractAccountNodes(payload)
    .map((node) => normalizeAccountNode(node, 0))
    .filter((node): node is Account => node !== null)
}

function normalizeSingleAccountNode(payload: unknown): Account | null {
  if (!isRecord(payload)) return null
  return normalizeAccountNode(payload as AccountNodePayload, 2)
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
      const normalized = normalizeSingleAccountNode(r.data)
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
      const normalized = normalizeSingleAccountNode(r.data)
      if (!normalized) throw new Error('Respuesta inválida al actualizar la cuenta.')
      return normalized
    }),

  deleteAccount: (companyId: number, accountId: number): Promise<void> =>
    httpClient.delete(`/accounts/company/${companyId}/${accountId}/`).then(() => undefined),
}
