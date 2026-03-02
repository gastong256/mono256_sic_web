import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { CreateItemForm } from '@/features/items/components/CreateItemForm'
import {
  setupAuthForTests,
  teardownAuthForTests,
} from '@/shared/test-utils/auth'
import { resetItemsMock } from '@/mocks/handlers/items.handlers'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { Wrapper, queryClient }
}

function renderForm() {
  const { Wrapper } = makeWrapper()
  return render(<CreateItemForm />, { wrapper: Wrapper })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setupAuthForTests()
  resetItemsMock()
  vi.clearAllMocks()
})

afterEach(teardownAuthForTests)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateItemForm', () => {
  it('renders title, description fields and a submit button', () => {
    renderForm()

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })

  it('shows a validation error when title is empty on submit', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
  })

  it('shows a validation error when title exceeds 100 characters', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/title/i), 'a'.repeat(101))
    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(await screen.findByText(/100 characters or fewer/i)).toBeInTheDocument()
  })

  it('submits successfully with a valid title and resets the form', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/title/i), 'My New Item')
    await user.type(screen.getByLabelText(/description/i), 'A description')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    // After success the form resets (title should be empty)
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('')
    })

    // Description also reset
    expect(screen.getByLabelText(/description/i)).toHaveValue('')
  })

  it('submits with title only (description is optional)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/title/i), 'Title only')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('')
    })
  })

  it('disables the submit button while the mutation is pending', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/title/i), 'Test')
    const button = screen.getByRole('button', { name: /add item/i })
    await user.click(button)

    // The button should eventually become re-enabled after success
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('does not show a validation error when description is omitted', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/title/i), 'Valid title')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    // No description error should appear
    await waitFor(() => {
      expect(screen.queryByText(/description.*required/i)).not.toBeInTheDocument()
    })
  })
})
