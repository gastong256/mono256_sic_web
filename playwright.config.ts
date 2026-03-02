import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration.
 *
 * The dev server (pnpm dev) is started automatically before tests run.
 * MSW is active in the dev server (VITE_USE_MOCK_API=true by default),
 * so no real backend is needed for e2e tests.
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Run test files in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only() is accidentally committed
  forbidOnly: !!process.env.CI,

  // Retry on CI to handle flakiness; no retries locally
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to prevent resource contention
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    // Base URL for all page.goto('/path') calls
    baseURL: 'http://localhost:3000',

    // Capture trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // Video on retry for better debugging
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add more browsers:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  // Start the Vite dev server before tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    // Reuse an already-running server locally; always start fresh on CI
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Ensure mock API is enabled for e2e tests
    env: {
      VITE_USE_MOCK_API: 'true',
    },
  },
})
