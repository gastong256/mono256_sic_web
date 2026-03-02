import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'

const BASE = env.VITE_API_BASE_URL

export interface MockItem {
  id: string
  title: string
  description: string
  createdAt: string
}

// Seed data — deterministic for testing
const SEED_ITEMS: MockItem[] = [
  {
    id: 'item_01',
    title: 'First Item',
    description: 'A sample item to demonstrate the feature',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'item_02',
    title: 'Second Item',
    description: 'Another sample item',
    createdAt: '2026-01-02T10:00:00.000Z',
  },
]

// Mutable in-memory store — reset via server.resetHandlers() in tests
let mockItems: MockItem[] = [...SEED_ITEMS]
let idCounter = SEED_ITEMS.length

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

export const itemsHandlers = [
  // GET /items
  http.get(`${BASE}/items`, async ({ request }) => {
    await delay(150)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({
      items: mockItems,
      total: mockItems.length,
    })
  }),

  // POST /items
  http.post(`${BASE}/items`, async ({ request }) => {
    await delay(200)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { title?: string; description?: string }

    if (!body.title || body.title.trim().length === 0) {
      return HttpResponse.json({ message: 'title is required' }, { status: 422 })
    }

    idCounter += 1
    const newItem: MockItem = {
      id: `item_${String(idCounter).padStart(2, '0')}`,
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      createdAt: new Date().toISOString(),
    }

    mockItems = [...mockItems, newItem]

    return HttpResponse.json(newItem, { status: 201 })
  }),
]

/** Reset mock item store to seed data. Call in test beforeEach if needed. */
export function resetItemsMock(): void {
  mockItems = [...SEED_ITEMS]
  idCounter = SEED_ITEMS.length
}
