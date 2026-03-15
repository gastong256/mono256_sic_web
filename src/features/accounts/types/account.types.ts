export interface Account {
  id: number
  code: string
  name: string
  type: string
  level: number
  is_leaf: boolean
  children?: Account[]
}

export interface CreateAccountPayload {
  name: string
  code: string
  parent_id: number
}

export interface UpdateAccountPayload {
  name?: string
  code?: string
}
