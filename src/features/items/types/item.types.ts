export interface Item {
  id: string
  title: string
  description: string
  createdAt: string
}

export interface ItemsResponse {
  items: Item[]
  total: number
}

export interface CreateItemPayload {
  title: string
  description?: string
}
