import { test, expect } from './fixtures/page.fixture'

/**
 * Items e2e tests.
 * All tests use the `authenticatedPage` fixture — login is handled once
 * per test via the fixture setup, not repeated manually.
 */
test.describe('Items', () => {
  // ── Page load ─────────────────────────────────────────────────────────────

  test('items page renders the heading and create form', async ({ authenticatedPage: page }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Items', exact: true })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('heading', { name: /create item/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('button', { name: /add item/i })).toBeVisible({ timeout: 10_000 })
  })

  test('items list shows seed items from MSW', async ({ authenticatedPage: page }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    // These come from the seed data in items.handlers.ts
    await expect(page.getByText('First Item')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Second Item')).toBeVisible({ timeout: 10_000 })
  })

  test('total item count badge is visible', async ({ authenticatedPage: page }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    // The badge renders the total count from the API response
    const badge = page.locator('span').filter({ hasText: /^\d+$/ }).first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
    const count = Number(await badge.textContent())
    expect(count).toBeGreaterThanOrEqual(2) // At least the 2 seed items
  })

  // ── Validation ────────────────────────────────────────────────────────────

  test('shows validation error when submitting with empty title', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /add item/i }).click()

    await expect(page.getByText(/title is required/i)).toBeVisible()
  })

  test('shows validation error when title exceeds 100 chars', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/title/i).first().fill('a'.repeat(101))
    await page.getByRole('button', { name: /add item/i }).click()

    await expect(page.getByText(/100 characters/i)).toBeVisible()
  })

  // ── Create item ───────────────────────────────────────────────────────────

  test('user can create a new item with title only', async ({ authenticatedPage: page }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    const uniqueTitle = `E2E Item ${Date.now()}`
    await page.getByLabel(/title/i).first().fill(uniqueTitle)
    await page.getByRole('button', { name: /add item/i }).click()

    // Item should appear in the list
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 })
  })

  test('user can create a new item with title and description', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    const uniqueTitle = `Described Item ${Date.now()}`
    const description = 'This is a test description'

    await page.getByLabel(/title/i).first().fill(uniqueTitle)
    await page
      .getByLabel(/description/i)
      .first()
      .fill(description)
    await page.getByRole('button', { name: /add item/i }).click()

    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 })
  })

  test('form resets after successful item creation', async ({ authenticatedPage: page }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    const titleInput = page.getByLabel(/title/i).first()
    await titleInput.fill('Reset Test Item')
    await page.getByRole('button', { name: /add item/i }).click()

    // Wait for the list to update
    await expect(page.getByText('Reset Test Item')).toBeVisible({ timeout: 10_000 })

    // Title field must be empty after success
    await expect(titleInput).toHaveValue('')
  })

  test('item count increases by 1 after creating a new item', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    const badge = page.locator('span').filter({ hasText: /^\d+$/ }).first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
    const initialCount = Number(await badge.textContent())

    await page.getByLabel(/title/i).first().fill('Count Test Item')
    await page.getByRole('button', { name: /add item/i }).click()

    await expect(badge).toHaveText(String(initialCount + 1), { timeout: 10_000 })
  })

  // ── Access control ────────────────────────────────────────────────────────

  test('unauthenticated user cannot access the items page', async ({ page }) => {
    await page.goto('/items')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fitems/)
  })
})
