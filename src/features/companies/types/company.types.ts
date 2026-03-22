export interface Company {
  id: number
  name: string
  description?: string | null
  tax_id: string | null
  owner_username: string
  account_count: number
  books_closed_until?: string | null
  is_demo?: boolean
  is_read_only?: boolean
  viewer_can_write?: boolean
  is_published?: boolean
  demo_slug?: string | null
  has_opening_entry?: boolean
  accounting_ready?: boolean
  opening_entry_id?: number | null
  created_at: string
  updated_at: string
}

export interface SetDemoPublicationPayload {
  is_published: boolean
}

export type OpeningInventoryKind = 'INITIAL' | 'GENERAL'

export interface OpeningEntryItemPayload {
  name: string
  parent_code: string
  amount: string
}

export interface OpeningEntryPayload {
  date: string
  inventory_kind: OpeningInventoryKind
  source_ref?: string
  assets: OpeningEntryItemPayload[]
  liabilities: OpeningEntryItemPayload[]
}

export interface CreateCompanyPayload {
  name: string
  description?: string
  tax_id?: string
  opening_entry?: OpeningEntryPayload
}

export interface UpdateCompanyPayload {
  name?: string
  description?: string
  tax_id?: string
}
