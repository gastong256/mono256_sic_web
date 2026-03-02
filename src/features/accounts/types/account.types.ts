export interface Account {
  id: number
  code: string
  name: string
  type: string
  depth: number
  children?: Account[]
}

export interface CreateAccountPayload {
  name: string
  code: string
  parent_id?: number
}

export interface UpdateAccountPayload {
  name?: string
  code?: string
}
