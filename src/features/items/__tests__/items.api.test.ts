import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { itemsApi } from '@/features/items/api/items.api'
import {
  setupAuthForTests,
  teardownAuthForTests,
} from '@/shared/test-utils/auth'
import { resetItemsMock } from '@/mocks/handlers/items.handlers'

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setupAuthForTests()
  resetItemsMock() // Restore seed data between tests
})

afterEach(teardownAuthForTests)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('itemsApi.getItems', () => {
  it('returns an ItemsResponse with items array and total', async () => {
    const result = await itemsApi.getItems()

    expect(result).toHaveProperty('items')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  it('returns the seed items by default', async () => {
    const result = await itemsApi.getItems()

    // Seed contains 2 items from items.handlers.ts
    expect(result.items.length).toBeGreaterThanOrEqual(2)
  })

  it('each item has the expected shape', async () => {
    const result = await itemsApi.getItems()
    const item = result.items[0]

    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('title')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('createdAt')
    expect(typeof item.id).toBe('string')
    expect(typeof item.title).toBe('string')
    expect(typeof item.createdAt).toBe('string')
  })
})

describe('itemsApi.createItem', () => {
  it('creates an item with title and description', async () => {
    const payload = { title: 'API Test Item', description: 'Created in test' }
    const item = await itemsApi.createItem(payload)

    expect(item.id).toBeTruthy()
    expect(item.title).toBe('API Test Item')
    expect(item.description).toBe('Created in test')
    expect(item.createdAt).toBeTruthy()
  })

  it('creates an item with title only (description is optional)', async () => {
    const item = await itemsApi.createItem({ title: 'Title only item' })

    expect(item.title).toBe('Title only item')
    expect(item.description).toBe('')
  })

  it('newly created item appears in subsequent getItems call', async () => {
    await itemsApi.createItem({ title: 'Brand new item' })
    const result = await itemsApi.getItems()
    const found = result.items.find((i) => i.title === 'Brand new item')

    expect(found).toBeDefined()
  })

  it('assigns a unique id to each created item', async () => {
    const a = await itemsApi.createItem({ title: 'Item A' })
    const b = await itemsApi.createItem({ title: 'Item B' })

    expect(a.id).not.toBe(b.id)
  })
})
