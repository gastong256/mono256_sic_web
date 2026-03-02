import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// ── Custom fixture types ──────────────────────────────────────────────────────

type AuthFixtures = {
  /**
   * A page that has already completed the login flow.
   * Use this in any test that requires an authenticated session
   * without repeating the login steps.
   */
  authenticatedPage: Page
}

// ── Extended test with auth fixture ──────────────────────────────────────────

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login')

    // Wait for MSW service worker to activate and the page to be ready
    await page.waitForLoadState('networkidle')

    // Fill credentials
    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to home (confirms successful login)
    await page.waitForURL('/', { timeout: 10_000 })

    // Yield the authenticated page to the test
    await use(page)

    // Teardown: clear localStorage to avoid state leaking between tests
    await page.evaluate(() => localStorage.clear())
  },
})

export { expect }
