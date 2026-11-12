import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Some sandboxes ship a Chromium that a freshly installed Playwright will not
// find on its own. Use it when it is there; everywhere else - CI, a laptop -
// Playwright's own download is correct and this is undefined.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH
  || (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined)

// Checks that open a browser, which nothing else here does.
//
// Pointed at production by default, because the question these answer is "is
// the live site working" rather than "does this branch compile". Override with
// E2E_BASE_URL to run them against a local dev server or a preview deploy.

export default defineConfig({
  testDir: './e2e',
  // A live site is being shared with real traffic, so this stays modest.
  workers: process.env.CI ? 2 : 3,
  fullyParallel: true,
  // No .only left behind in a suite that guards a live site.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  outputDir: 'e2e-results',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://talenthousecollective.co.uk',
    // A trace on every test costs about a third of the run. One on a retry is
    // the one you actually want, because it is the failure you are chasing.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 12_000,
    launchOptions: {
      executablePath,
      // A sandboxed Chromium needs this; it is harmless everywhere else.
      args: executablePath ? ['--no-sandbox'] : [],
    },
  },
  projects: [
    // Signs in once per role and saves the session. Everything else reuses it,
    // which is what keeps the suite under the platform's own rate limit.
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    // The phone checks are about things that only exist at phone width - the
    // menu button is hidden above lg - so desktop must not run them, or it
    // fails for the correct behaviour.
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /phone\.spec\.ts|auth\.setup\.ts/,
      dependencies: ['setup'],
    },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /phone\.spec\.ts/ },
  ],
})
