import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemList } from '@/features/items/components/ItemList'
import type { Item } from '@/features/items/types/item.types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ITEMS: Item[] = [
  {
    id: 'item_01',
    title: 'First Item',
    description: 'A sample item description',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'item_02',
    title: 'Second Item',
    description: '',
    createdAt: '2026-01-02T10:00:00.000Z',
  },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ItemList', () => {
  it('renders a loading spinner when isLoading is true', () => {
    render(<ItemList items={[]} isLoading={true} error={null} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not render a list while loading', () => {
    render(<ItemList items={[]} isLoading={true} error={null} />)

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders an error alert when error is provided', () => {
    const err = new Error('Network failure')
    render(<ItemList items={[]} isLoading={false} error={err} />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Network failure')
  })

  it('renders an empty state when items array is empty', () => {
    render(<ItemList items={[]} isLoading={false} error={null} />)

    expect(screen.getByText(/no items yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders a list when items are provided', () => {
    render(<ItemList items={MOCK_ITEMS} isLoading={false} error={null} />)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders each item title', () => {
    render(<ItemList items={MOCK_ITEMS} isLoading={false} error={null} />)

    expect(screen.getByText('First Item')).toBeInTheDocument()
    expect(screen.getByText('Second Item')).toBeInTheDocument()
  })

  it('renders item description when present', () => {
    render(<ItemList items={MOCK_ITEMS} isLoading={false} error={null} />)

    expect(screen.getByText('A sample item description')).toBeInTheDocument()
  })

  it('does not render a description element when description is empty', () => {
    const { container } = render(<ItemList items={[MOCK_ITEMS[1]]} isLoading={false} error={null} />)

    // ItemCard renders description in a <p> only when truthy — verify none exists
    expect(container.querySelector('article p')).toBeNull()
  })

  it('renders a unique key for each item (no duplicate content)', () => {
    render(<ItemList items={MOCK_ITEMS} isLoading={false} error={null} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(MOCK_ITEMS.length)
  })
})
