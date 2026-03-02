export interface Company {
  id: number
  name: string
  tax_id: string | null
  created_at: string
  owner?: { username: string }
}

export interface CreateCompanyPayload {
  name: string
  tax_id?: string
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>
