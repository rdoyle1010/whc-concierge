import { test as setup, expect, Page } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { TALENT_STATE, EMPLOYER_STATE, account, MISSING } from './accounts'

// Sign in once per role, then let every test reuse the session.
//
// The first version signed in inside each test. Seven sign-ins in ninety
// seconds, plus a retry, and the platform did exactly what it should: "Too
// many sign-in attempts. Wait a few minutes and try again." Every signed-in
// check then failed, for a reason that had nothing to do with the thing being
// checked.
//
// That is worse than a gap. A suite that fails on its own traffic teaches
// people to ignore it, and an ignored suite is how a real failure ships. Two
// sign-ins per run, reused everywhere, stays well inside the limit and is
// faster besides.

const DIR = 'e2e/.auth'

async function signInAndSave(page: Page, who: { email: string; password: string }, side: 'talent' | 'employer', file: string) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })

  await page.goto('/login')
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /accept/i }).click({ timeout: 4000 }).catch(() => {})

  // Talent | Hotel | Consultancy. The sides are not interchangeable: an
  // employer submitting the Talent side is correctly refused.
  if (side === 'employer') {
    await page.getByRole('button', { name: /^hotel$/i }).first().click({ timeout: 5000 })
    await page.waitForTimeout(600)
  }

  await page.locator('input[type="email"]').first().fill(who.email)
  await page.locator('input[type="password"]').first().fill(who.password)
  await Promise.all([
    page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 }),
    page.locator('button[type="submit"]').first().click(),
  ])

  // Fail loudly here rather than leave every dependent test to fail
  // mysteriously on a page it did not expect.
  expect(page.url(), `signing in as ${side} did not leave the login page`).not.toContain('/login')
  await page.context().storageState({ path: file })
}

setup('sign in as a professional', async ({ page }) => {
  const who = account('TALENT')
  setup.skip(!who, MISSING('talent'))
  await signInAndSave(page, who!, 'talent', TALENT_STATE)
})

setup('sign in as a property', async ({ page }) => {
  const who = account('EMPLOYER')
  setup.skip(!who, MISSING('employer'))
  await signInAndSave(page, who!, 'employer', EMPLOYER_STATE)
})
