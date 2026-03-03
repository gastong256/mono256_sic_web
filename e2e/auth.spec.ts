import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  // Clear any persisted auth state before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  // ── Access control ──────────────────────────────────────────────────────────

  test('unauthenticated user visiting /companies is redirected to /login', async ({ page }) => {
    await page.goto('/companies')

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcompanies/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('unauthenticated user visiting /profile is redirected to /login', async ({ page }) => {
    await page.goto('/profile')

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fprofile/)
  })

  // ── Login ───────────────────────────────────────────────────────────────────

  test('renders the login form with email and password fields', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows mock credential hint in mock mode', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('user@example.com')).toBeVisible()
  })

  test('shows validation error for empty email', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('not-an-email')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('shows API error alert for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
  })

  test('successful login redirects to /', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })

  test('after login, nav shows authenticated links', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('/', { timeout: 10_000 })

    await expect(page.getByRole('link', { name: 'Empresas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible()
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
  })

  // ── returnTo redirect ───────────────────────────────────────────────────────

  test('redirects to returnTo path after login', async ({ page }) => {
    await page.goto('/login?returnTo=%2Fcompanies')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/companies', { timeout: 10_000 })
  })

  test('ignores external returnTo (open redirect protection)', async ({ page }) => {
    // An external URL in returnTo should be treated as invalid
    await page.goto('/login?returnTo=https%3A%2F%2Fevil.example.com')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to home, NOT to the external URL
    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })

  // ── Logout ──────────────────────────────────────────────────────────────────

  test('user can log out and is redirected to /login', async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Log out
    await page.getByRole('button', { name: /logout/i }).click()

    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })

  test('after logout, protected routes redirect to /login', async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Log out
    await page.getByRole('button', { name: /logout/i }).click()
    await page.waitForURL('/login', { timeout: 5_000 })

    // Try to access a protected route
    await page.goto('/companies')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcompanies/)
  })

  // ── Already authenticated ───────────────────────────────────────────────────

  test('authenticated user visiting /login is redirected to /', async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email address/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Attempt to revisit /login
    await page.goto('/login')
    await expect(page).toHaveURL('/', { timeout: 5_000 })
  })
})
