export interface Company {
  id: number
  name: string
  tax_id: string | null
  owner_username: string
  account_count: number
  created_at: string
  updated_at: string
}

export interface CreateCompanyPayload {
  name: string
  tax_id?: string
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>
